import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import { requireAdminSession } from '@/lib/adminAuth';

export async function GET(_request, { params }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  if (!mongoose.Types.ObjectId.isValid(params.id)) return NextResponse.json({ message: 'Invalid application ID.' }, { status: 400 });

  await connectDB();
  const application = await Application.findById(params.id)
    .populate('userId', 'name email phone village ward address')
    .select('applicationNumber serviceType status formData documents adminDocuments adminRemarks userId createdAt updatedAt')
    .lean();
  if (!application) return NextResponse.json({ message: 'Application not found.' }, { status: 404 });

  return NextResponse.json({ application: { ...application, id: application._id.toString() } });
}
