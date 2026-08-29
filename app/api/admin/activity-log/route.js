import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import AuditLog from '@/models/AuditLog';
import { requireAdminSession } from '@/lib/adminAuth';

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action')?.trim();
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 100));
  const filter = action ? { action: { $regex: action, $options: 'i' } } : {};
  const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit).lean();
  return NextResponse.json({ logs: logs.map((log) => ({ ...log, id: log._id.toString() })) });
}
