import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session?.user?.role !== "admin") {
    return null;
  }

  return session;
}