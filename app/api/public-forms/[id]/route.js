import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import PublicForm from '@/models/PublicForm';

function safeFileName(fileName) {
  return fileName.replace(/[\r\n"]/g, '').replace(/[^\w .()-]/g, '_').slice(0, 150) || 'official-form.pdf';
}

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ message: 'Form not found.' }, { status: 404 });
  }

  try {
    await connectDB();
    const form = await PublicForm.findById(id).select('fileName fileData');

    if (!form) {
      return NextResponse.json({ message: 'Form not found.' }, { status: 404 });
    }

    const fileData = form.fileData;
    if (!Buffer.isBuffer(fileData) || fileData.length === 0) {
      console.error(`Public form ${id} has no readable PDF data.`);
      return NextResponse.json({ message: 'The stored form file is unavailable. Please contact the Panchayat office.' }, { status: 500 });
    }

    return new Response(fileData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName(form.fileName)}"`,
        'Content-Length': String(fileData.length),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Public form download failed:', error);
    return NextResponse.json({ message: 'Form downloads are temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}
