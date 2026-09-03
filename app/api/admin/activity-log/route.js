import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import AuditLog from '@/models/AuditLog';
import { requireAdminSession } from '@/lib/adminAuth';

function redactDetails(details) {
  return Object.fromEntries(Object.entries(details || {}).map(([key, value]) => (
    /aadhaar|password|token|secret/i.test(key) ? [key, '[redacted]'] : [key, value]
  )));
}

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action')?.trim();
  const entityType = searchParams.get('entityType')?.trim();
  const user = searchParams.get('user')?.trim();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const filter = {};
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (entityType) filter.entityType = entityType;
  if (user) filter.$or = [{ userName: { $regex: user, $options: 'i' } }, { uniqueId: { $regex: user, $options: 'i' } }];
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      id: log._id.toString(),
      userId: log.userId ? log.userId.toString() : null,
      userName: log.userName || 'System',
      uniqueId: log.uniqueId || 'system',
      details: redactDetails(log.details),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
