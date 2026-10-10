import { NextResponse } from "next/server";
import { requireServiceManagerSession } from "@/lib/adminAuth";
import { isServiceChangeRoute, isServiceChangePath } from "@/lib/serviceChangePolicy";
import ServiceChange from "@/models/ServiceChange";
import { writeAuditLog } from "@/lib/writeAuditLog";

const MAX_CHANGE_BYTES = 10 * 1024 * 1024;
const REDACTED_KEY = /aadhaar|password|token|secret|document|fileurl|image|photo/i;

function makePreview(value, depth = 0) {
  if (depth > 4) return "[nested data]";
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => makePreview(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).slice(0, 40).map(([key, item]) => [
        key,
        REDACTED_KEY.test(key) ? "[redacted]" : makePreview(item, depth + 1),
      ])
    );
  }
  if (typeof value === "string" && value.length > 300) return `${value.slice(0, 300)}…`;
  return value;
}

export async function submitServiceChange(request) {
  const session = await requireServiceManagerSession();
  if (!session || session.user.role !== "subadmin") {
    return NextResponse.json({ message: "Sub-admin access required." }, { status: 403 });
  }

  try {
    const path = request.headers.get("x-service-change-path") || "";
    const parsedPath = new URL(path, "http://localhost");
    const method = request.method;
    if (!isServiceChangePath(path) || !isServiceChangeRoute(parsedPath.pathname, method)) {
      return NextResponse.json({ message: "This service operation cannot be submitted for approval." }, { status: 403 });
    }

    const body = Buffer.from(await request.arrayBuffer());
    if (body.length > MAX_CHANGE_BYTES) {
      return NextResponse.json({ message: "This change is too large to submit for approval (10 MB maximum)." }, { status: 413 });
    }

    const contentType = request.headers.get("content-type") || "";
    const preview = contentType.includes("application/json")
      ? makePreview(JSON.parse(body.toString("utf8") || "{}"))
      : { upload: contentType || "binary", bytes: body.length };
    const change = await ServiceChange.create({
      submittedBy: session.user.id,
      submittedByName: session.user.name || "",
      method,
      path,
      contentType,
      body,
      preview,
    });

    await writeAuditLog({
      session,
      action: "Sub-admin service change proposed",
      entityType: "service-change",
      entityId: change._id.toString(),
      details: { changeId: change._id.toString(), method, path },
    });
    return NextResponse.json({
      success: true,
      pendingApproval: true,
      changeId: change._id.toString(),
      message: "Submitted for main-admin approval. The service will update after approval.",
    }, { status: 202 });
  } catch (error) {
    console.error("Sub-admin service change submission error:", error);
    return NextResponse.json({ message: error.message || "Unable to submit service change." }, { status: 400 });
  }
}
