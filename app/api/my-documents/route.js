import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CitizenDocument from '@/models/CitizenDocument';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  await connectDB();
  const documents = await CitizenDocument.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .select('documentType fileName mimeType uploadedBy source applicationId createdAt')
    .lean();

  return NextResponse.json({ documents: documents.map((document) => ({
    ...document,
    id: document._id.toString(),
    viewUrl: `/api/my-documents/${document._id}`,
  })) });
}
