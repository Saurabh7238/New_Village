import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import PublicForm from '@/models/PublicForm';
import { requireAdminSession } from '@/lib/adminAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';

const FORM_SERVICES = new Set(['birth', 'death', 'grievance', 'voter']);
const FORM_LANGUAGES = new Set(['en', 'hi', 'bilingual']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = Math.ceil(MAX_FILE_BYTES / 3) * 4 + 128;

function getPdfBuffer(fileData) {
  if (typeof fileData !== 'string' || fileData.length > MAX_DATA_URL_LENGTH) return null;
  const match = /^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/.exec(fileData);
  if (!match) return null;

  const buffer = Buffer.from(match[1], 'base64');
  if (!buffer.length || buffer.length > MAX_FILE_BYTES) return null;
  const header = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1');
  return header.includes('%PDF-') ? buffer : null;
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    await connectDB();
    const forms = await PublicForm.find({})
      .sort({ createdAt: -1 })
      .select('title service language fileName fileSize sourceNote createdAt')
      .lean();

    return NextResponse.json({
      forms: forms.map((form) => ({
        id: form._id.toString(),
        title: form.title,
        service: form.service,
        language: form.language,
        fileName: form.fileName,
        fileSize: form.fileSize,
        sourceNote: form.sourceNote,
        createdAt: form.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin public forms fetch failed:', error);
    return NextResponse.json({ message: 'Public forms are temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim().slice(0, 150) : '';
    const sourceNote = typeof body.sourceNote === 'string' ? body.sourceNote.trim() : '';
    const file = getPdfBuffer(body.fileData);

    if (!title || title.length > 120 || !fileName || !FORM_SERVICES.has(body.service) ||
      !FORM_LANGUAGES.has(body.language) || !sourceNote || sourceNote.length > 300 ||
      body.verified !== true || !file ||
      !fileName.toLocaleLowerCase().endsWith('.pdf')) {
      return NextResponse.json({
        message: 'Confirm public approval and provide a title, service, language, source/reference, and valid PDF under 5 MB.',
      }, { status: 400 });
    }

    await connectDB();
    const form = await PublicForm.create({
      title,
      service: body.service,
      language: body.language,
      fileName,
      fileData: file,
      fileSize: file.length,
      sourceNote,
      verifiedBy: session.user.id,
    });

    await writeAuditLog({
      session,
      action: 'Official form published',
      entityType: 'public-form',
      entityId: form._id.toString(),
      details: { title, service: form.service, language: form.language, fileName, confirmedPublicApproval: true },
    });

    return NextResponse.json({ message: 'Verified form published.', id: form._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('Public form publishing error:', error);
    return NextResponse.json({ message: 'Unable to publish the form.' }, { status: 500 });
  }
}
