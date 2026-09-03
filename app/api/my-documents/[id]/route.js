import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import CitizenDocument from '@/models/CitizenDocument';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';

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

export async function DELETE(_request, { params }) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid document ID.' }, { status: 400 });

  await connectDB();
  const document = await CitizenDocument.findOne({ _id: id, userId: session.user.id }).lean();

  if (!document) {
    return NextResponse.json({ message: 'Document not found or you cannot delete it.' }, { status: 404 });
  }

  if (document.uploadedBy !== 'citizen') {
    return NextResponse.json({ message: 'Only documents uploaded by you can be deleted.' }, { status: 403 });
  }

  await CitizenDocument.deleteOne({ _id: id, userId: session.user.id });
  await writeAuditLog({ session, action: 'Citizen document deleted', details: { documentId: id, fileName: document.fileName, source: document.source } });

  return NextResponse.json({ message: 'Document deleted successfully.' });
}
