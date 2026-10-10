import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import { requireAdminSession } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/writeAuditLog";

export async function GET() {
  const session = await requireAdminSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Main admin access required." }, { status: 403 });
  }

  await connectDB();
  const users = await User.find({ role: "subadmin" })
    .select("name email phone uniqueId status createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({
    users: users.map(({ _id, ...user }) => ({ id: _id.toString(), ...user })),
  });
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Main admin access required." }, { status: 403 });
  }

  try {
    const { identifier, userId, enabled } = await request.json();
    if (typeof enabled !== "boolean" || (enabled && !String(identifier || "").trim()) || (!enabled && !userId)) {
      return NextResponse.json({ message: "Provide a user phone or email and whether to grant access." }, { status: 400 });
    }

    await connectDB();
    const user = enabled
      ? await User.findOne({
          $or: [
            { email: String(identifier).trim().toLowerCase() },
            { phone: String(identifier).trim() },
          ],
        })
      : await User.findOne({ _id: userId, role: "subadmin" });
    if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });
    if (enabled && user.role === "admin") {
      return NextResponse.json({ message: "A main admin cannot be changed to a sub-admin." }, { status: 400 });
    }
    if (!enabled && user.role !== "subadmin") {
      return NextResponse.json({ message: "This user is not a sub-admin." }, { status: 409 });
    }

    const previousRole = user.role;
    user.role = enabled ? "subadmin" : "citizen";
    await user.save();
    await writeAuditLog({
      session,
      action: enabled ? "Sub-admin access granted" : "Sub-admin access revoked",
      entityType: "user",
      entityId: user._id.toString(),
      details: { userId: user._id.toString(), name: user.name, previousRole, role: user.role },
    });

    return NextResponse.json({
      success: true,
      message: `${user.name} is ${enabled ? "now a sub-admin" : "no longer a sub-admin"}. They must sign out and sign back in for the role change to take effect.`,
    });
  } catch (error) {
    console.error("Sub-admin management error:", error);
    return NextResponse.json({ message: "Unable to update sub-admin access." }, { status: 500 });
  }
}
