import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CitizenDocument from '@/models/CitizenDocument';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_DOCUMENT_LENGTH = 5 * 1024 * 1024 * 1.37;

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

export async function POST(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to upload documents.' }, { status: 401 });

  try {
    const { documentType = 'Personal document', documents = [] } = await request.json();
    if (!Array.isArray(documents) || documents.length < 1 || documents.length > 5) {
      return NextResponse.json({ message: 'Choose between one and five documents.' }, { status: 400 });
    }
    const validDocuments = documents.every((document) =>
      document &&
      typeof document.fileName === 'string' &&
      typeof document.fileUrl === 'string' &&
      ALLOWED_MIME_TYPES.has(document.mimeType) &&
      document.fileUrl.startsWith(`data:${document.mimeType};base64,`) &&
      document.fileUrl.length <= MAX_DOCUMENT_LENGTH
    );
    if (!validDocuments) return NextResponse.json({ message: 'Only PDF, JPG, and PNG files under 5 MB are allowed.' }, { status: 400 });

    await connectDB();
    const saved = await CitizenDocument.insertMany(documents.map((document) => ({
      userId: session.user.id,
      documentType: String(documentType).trim().slice(0, 100) || 'Personal document',
      fileName: document.fileName.slice(0, 150),
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      uploadedBy: 'citizen',
      source: 'citizen-vault',
    })));

    return NextResponse.json({ message: `${saved.length} document(s) uploaded successfully.`, count: saved.length }, { status: 201 });
  } catch (error) {
    console.error('Citizen vault upload error:', error);
    return NextResponse.json({ message: 'Unable to upload documents.' }, { status: 400 });
  }
}
