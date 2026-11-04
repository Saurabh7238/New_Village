import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import PublicForm from '@/models/PublicForm';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get('limit'));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 50)
      : 50;
    const forms = await PublicForm.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
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
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Public forms fetch failed:', error);
    return NextResponse.json({ message: 'Public forms are temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}
