import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import PublicForm from '@/models/PublicForm';

export async function GET() {
  try {
    await connectDB();
    const forms = await PublicForm.find({})
      .sort({ service: 1, language: 1, createdAt: -1 })
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
        updatedAt: form.updatedAt,
      })),
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Public forms fetch failed:', error);
    return NextResponse.json({ message: 'Public forms are temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}
