import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import DevelopmentReport from '@/models/DevelopmentReport';
import { requireServiceManagerSession } from '@/lib/adminAuth';

export async function GET() {
  try {
    const session = await requireServiceManagerSession();
    if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

    await dbConnect();
    const reports = await DevelopmentReport.find()
      .populate('projectId', 'title wardNo')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch project reports for moderation:', error);
    return NextResponse.json({ message: 'Failed to fetch project reports.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await requireServiceManagerSession();
    if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

    const { id, status } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(id) || !['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ message: 'A valid report ID and moderation status are required.' }, { status: 400 });
    }
    await dbConnect();
    const report = await DevelopmentReport.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!report) return NextResponse.json({ message: 'Report not found.' }, { status: 404 });
    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to moderate project report:', error);
    return NextResponse.json({ message: 'Failed to update project report.' }, { status: 500 });
  }
}
