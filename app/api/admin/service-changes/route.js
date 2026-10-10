import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { requireAdminSession } from "@/lib/adminAuth";
import { isServiceChangeRoute, isServiceChangePath } from "@/lib/serviceChangePolicy";
import ServiceChange from "@/models/ServiceChange";
import { writeAuditLog } from "@/lib/writeAuditLog";

export async function GET() {
  const session = await requireAdminSession();
  if (!session || session.user.role !== "admin") return NextResponse.json({ message: "Main admin access required." }, { status: 403 });

  await connectDB();
  const changes = await ServiceChange.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .select("-body")
    .lean();

  return NextResponse.json({
    changes: changes.map((change) => ({
      ...change,
      id: change._id.toString(),
      submittedBy: change.submittedBy?.toString() || null,
      reviewedBy: change.reviewedBy?.toString() || null,
    })),
  });
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session || session.user.role !== "admin") return NextResponse.json({ message: "Main admin access required." }, { status: 403 });

  try {
    const { id, decision, message = "" } = await request.json();
    if (!id || !["approve", "reject"].includes(decision)) {
      return NextResponse.json({ message: "A change request and valid decision are required." }, { status: 400 });
    }

    await connectDB();
    let destination = null;
    if (decision === "approve") {
      const candidate = await ServiceChange.findOne({ _id: id, status: { $in: ["pending", "failed"] } })
        .select("path method")
        .lean();
      if (!candidate) {
        return NextResponse.json({ message: "Change request not found or already reviewed." }, { status: 409 });
      }
      if (candidate.path.length > 2048 || !isServiceChangePath(candidate.path) || !isServiceChangeRoute(new URL(candidate.path, "http://localhost").pathname, candidate.method)) {
        return NextResponse.json({ message: "This service operation is not approved for replay." }, { status: 400 });
      }
      const baseUrl = process.env.NEXTAUTH_URL;
      if (!baseUrl) throw new Error("NEXTAUTH_URL must be configured to apply approved service changes.");
      destination = new URL(candidate.path, baseUrl);
      if (destination.origin !== new URL(baseUrl).origin) {
        return NextResponse.json({ message: "Invalid service change destination." }, { status: 400 });
      }
    }

    const change = await ServiceChange.findOneAndUpdate(
      { _id: id, status: { $in: ["pending", "failed"] } },
      {
        $set: {
          status: decision === "approve" ? "processing" : "rejected",
          reviewedBy: session.user.id,
          reviewedByName: session.user.name || "",
          reviewedAt: new Date(),
          reviewMessage: String(message).slice(0, 1000),
        },
      },
      { new: true }
    );
    if (!change) {
      return NextResponse.json({ message: "Change request not found or already reviewed." }, { status: 409 });
    }

    if (decision === "reject") {
      change.body = Buffer.alloc(0);
      await change.save();
      await writeAuditLog({
        session,
        action: "Sub-admin service change rejected",
        entityType: "service-change",
        entityId: change._id.toString(),
        details: { changeId: change._id.toString(), proposedBy: change.submittedByName, path: change.path, method: change.method },
      });
      return NextResponse.json({ success: true, changeId: change._id.toString(), status: change.status });
    }

    const headers = new Headers();
    if (change.contentType) headers.set("content-type", change.contentType);
    const cookie = request.headers.get("cookie");
    if (cookie) headers.set("cookie", cookie);
    headers.set("origin", destination.origin);

    let response;
    try {
      response = await fetch(destination, {
        method: change.method,
        headers,
        body: ["GET", "HEAD"].includes(change.method) ? undefined : Buffer.from(change.body || []),
        cache: "no-store",
        redirect: "manual",
      });
    } catch (error) {
      change.status = "failed";
      change.reviewMessage = "Service update could not reach the application.";
      await change.save();
      throw error;
    }
    const responseText = await response.text();
    if (!response.ok) {
      change.status = "failed";
      change.reviewMessage = `Service update failed (${response.status}).`;
      await change.save();
      return NextResponse.json({ message: change.reviewMessage, detail: responseText.slice(0, 300) }, { status: 502 });
    }

    change.status = "approved";
    change.body = Buffer.alloc(0);
    if (message) change.reviewMessage = String(message).slice(0, 1000);
    await change.save();
    await writeAuditLog({
      session,
      action: "Sub-admin service change approved and applied",
      entityType: "service-change",
      entityId: change._id.toString(),
      details: { changeId: change._id.toString(), proposedBy: change.submittedByName, path: change.path, method: change.method },
    });

    return NextResponse.json({ success: true, changeId: change._id.toString(), status: change.status });
  } catch (error) {
    console.error("Service change review error:", error);
    return NextResponse.json({ message: error.message || "Unable to review service change." }, { status: 500 });
  }
}
