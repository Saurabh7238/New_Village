import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import CitizenDocument from '@/models/CitizenDocument';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

export async function GET(_request, { params }) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid document ID.' }, { status: 400 });

  await connectDB();
  const document = await CitizenDocument.findOne({ _id: id, userId: session.user.id }).lean();
  const match = document?.fileUrl?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ message: 'Document not found.' }, { status: 404 });

  const safeName = (document.fileName || 'document').replace(/["\\\r\n]/g, '_');
  return new NextResponse(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1],
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
