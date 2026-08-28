import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import { requireAdminSession } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  if (!mongoose.Types.ObjectId.isValid(params.id)) return NextResponse.json({ message: 'Invalid application ID.' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const index = Number(searchParams.get('index'));
  const kind = searchParams.get('kind');
  if (!Number.isInteger(index) || index < 0 || !['citizen', 'panchayat'].includes(kind)) return NextResponse.json({ message: 'Invalid document request.' }, { status: 400 });

  await connectDB();
  const application = await Application.findById(params.id).select(kind === 'citizen' ? 'documents' : 'adminDocuments').lean();
  const document = (kind === 'citizen' ? application?.documents : application?.adminDocuments)?.[index];
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
