import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import PublicForm from '@/models/PublicForm';
import { requireAdminSession } from '@/lib/adminAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';

export async function DELETE(_request, { params }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ message: 'Invalid form ID.' }, { status: 400 });
  }

  try {
    await connectDB();
    const form = await PublicForm.findByIdAndDelete(id).select('title service language fileName').lean();
    if (!form) return NextResponse.json({ message: 'Form not found.' }, { status: 404 });

    await writeAuditLog({
      session,
      action: 'Official form removed',
      entityType: 'public-form',
      entityId: id,
      details: form,
    });

    return NextResponse.json({ message: 'Form removed.' });
  } catch (error) {
    console.error('Public form removal failed:', error);
    return NextResponse.json({ message: 'Unable to remove the form right now.' }, { status: 503 });
  }
}
