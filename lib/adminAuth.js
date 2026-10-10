import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

async function getActiveAdminSession(roles) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("role status name uniqueId").lean();
  if (!user || user.status !== "active" || !roles.includes(user.role)) return null;

  return {
    ...session,
    user: { ...session.user, role: user.role, name: user.name, uniqueId: user.uniqueId },
  };
}

export async function requireAdminSession() {
  return getActiveAdminSession(["admin"]);
}

export async function requireServiceManagerSession() {
  return getActiveAdminSession(["admin", "subadmin"]);
}