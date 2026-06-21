import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import NotificationBoard from '@/models/NotificationBoard';
import NotificationDocument from '@/models/NotificationDocument';
import { ALLOWED_MIME_TYPES } from '@/lib/notificationConstants';
import { authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function getSession() {
  return await getServerSession(authOptions);
}

async function fileToBase64(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return {
    dataUri: `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`,
    mimeType: file.type || 'application/octet-stream',
  };
}

// --- POST (UPLOAD DOCUMENTS) ---
export async function POST(request, { params }) {
  try {
    const session = await getSession();

    // Admin only
    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id: notificationId } = params;

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Valid notification ID is required' },
        { status: 400 }
      );
    }

    // Verify notification exists
    const notification = await NotificationBoard.findById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedDocuments = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: File size exceeds 10MB limit`);
          continue;
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          errors.push(`${file.name}: File type not allowed. Only PDF, DOC, DOCX, JPG, PNG allowed`);
          continue;
        }

        // Convert to Base64
        const { dataUri, mimeType } = await fileToBase64(file);

        // Create document record
        const document = await NotificationDocument.create({
          notificationId,
          fileName: file.name,
          filePath: dataUri,
          fileUrl: null,
          fileSize: file.size,
          mimeType,
        });

        uploadedDocuments.push({
          id: document._id.toString(),
          fileName: document.fileName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          uploadedAt: document.uploadedAt,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push(`${file.name}: Upload failed`);
      }
    }

    if (uploadedDocuments.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files were uploaded successfully', errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${uploadedDocuments.length} file(s) uploaded successfully`,
        documents: uploadedDocuments,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Document Upload Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}

// --- DELETE (REMOVE DOCUMENT) ---
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();

    // Admin only
    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id: notificationId } = params;
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Valid notification ID is required' },
        { status: 400 }
      );
    }

    if (!docId || !mongoose.Types.ObjectId.isValid(docId)) {
      return NextResponse.json(
        { success: false, message: 'Valid document ID is required' },
        { status: 400 }
      );
    }

    // Verify document belongs to this notification
    const document = await NotificationDocument.findOne({
      _id: docId,
      notificationId,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete document
    await NotificationDocument.deleteOne({ _id: docId });

    return NextResponse.json(
      { success: true, message: 'Document deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE Document Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
