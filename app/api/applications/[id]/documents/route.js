import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';
import CitizenDocument from '@/models/CitizenDocument';
import { dataUrlByteLength, hasDocumentQuota, MAX_USER_DOCUMENT_BYTES } from '@/lib/documentQuota';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

function validateDocuments(documents) {
  if (!Array.isArray(documents)) return [];
  if (documents.length > 5) throw new Error('You can upload up to five documents.');

  return documents.map((document) => {
    if (!document || typeof document.fileName !== 'string' || typeof document.fileUrl !== 'string' || !ALLOWED_MIME_TYPES.has(document.mimeType)) {
      throw new Error('Only PDF, JPG, and PNG documents are allowed.');
    }

    if (!document.fileUrl.startsWith(`data:${document.mimeType};base64,`) || document.fileUrl.length > MAX_DOCUMENT_BYTES * 1.37) {
      throw new Error('Each document must be smaller than 5 MB.');
    }

    return {
      fileName: document.fileName.slice(0, 150),
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      uploadedAt: new Date(),
    };
  });
}

export async function POST(request, { params }) {
  const session = await requireAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ message: 'Please sign in to upload supporting documents.' }, { status: 401 });
  }

  try {
    const { documents = [] } = await request.json();
    const safeDocuments = validateDocuments(documents);
    if (!safeDocuments.length) {
      return NextResponse.json({ message: 'Choose at least one document to upload.' }, { status: 400 });
    }

    await connectDB();
    const application = await Application.findOne({ _id: params.id, userId: session.user.id }).lean();
    if (!application) {
      return NextResponse.json({ message: 'Application not found.' }, { status: 404 });
    }

    const existingDocuments = Array.isArray(application.documents) ? application.documents : [];
    const mergedDocuments = [...existingDocuments, ...safeDocuments];
    const vaultDocuments = await CitizenDocument.find({ userId: session.user.id }).select('fileUrl').lean();
    const existingVaultBytes = vaultDocuments.reduce((total, document) => total + dataUrlByteLength(document.fileUrl), 0);
    if (!hasDocumentQuota(existingVaultBytes, safeDocuments)) return NextResponse.json({ message: `Your document vault cannot exceed ${MAX_USER_DOCUMENT_BYTES / (1024 * 1024)} MB.` }, { status: 400 });
    const updatedApplication = await Application.findByIdAndUpdate(
      params.id,
      {
        $set: {
          documents: mergedDocuments,
          status: 'Updated',
          requestedDocuments: [],
          adminRemarks: 'Citizen uploaded the required additional documents.',
        },
      },
      { new: true }
    ).lean();
    await CitizenDocument.insertMany(safeDocuments.map((document) => ({
      userId: session.user.id,
      applicationId: application._id,
      documentType: `${application.serviceType.replace(/-/g, ' ')} supporting document`,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      uploadedBy: 'citizen',
    })));

    await writeAuditLog({
      session,
      action: 'Additional documents uploaded',
      details: {
        applicationId: params.id,
        fileCount: safeDocuments.length,
        status: updatedApplication?.status,
      },
    });

    return NextResponse.json({
      message: 'Additional documents uploaded successfully. Your application status is now Updated.',
      application: {
        ...updatedApplication,
        id: updatedApplication._id.toString(),
      },
    });
  } catch (error) {
    console.error('Application document upload error:', error);
    return NextResponse.json({ message: error.message || 'Unable to upload documents.' }, { status: 400 });
  }
}
