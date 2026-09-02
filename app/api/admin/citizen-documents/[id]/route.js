import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import CitizenDocument from '@/models/CitizenDocument';
import { requireAdminSession } from '@/lib/adminAuth';

export async function GET(_request, { params }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid document ID.' }, { status: 400 });
  await connectDB();
  const document = await CitizenDocument.findById(id).lean();
  const match = document?.fileUrl?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ message: 'Document not found.' }, { status: 404 });
  const safeName = (document.fileName || 'document').replace(/["\\\r\n]/g, '_');
  return new NextResponse(Buffer.from(match[2], 'base64'), { headers: { 'Content-Type': match[1], 'Content-Disposition': `inline; filename="${safeName}"`, 'Cache-Control': 'private, no-store' } });
}
