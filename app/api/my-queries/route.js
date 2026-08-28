import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Query from '@/models/Query';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const queries = await Query.find({ userId: session.user.id }).sort({ createdAt: -1 }).select('queryId subject category priority status ward assignedTo adminRemarks resolutionPhoto auditLog attachments createdAt updatedAt resolvedAt').lean();
  return NextResponse.json({ queries: queries.map((query) => ({ ...query, id: query._id.toString() })) });
}
