import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireAuthenticatedSession() {
  const session = await getCurrentSession();
  return session?.user?.id ? session : null;
}

export function isAdminOrStaff(session) {
  return ['admin', 'staff'].includes(session?.user?.role);
}
