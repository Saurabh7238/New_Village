import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Development from '@/models/Development';
import DevelopmentReport from '@/models/DevelopmentReport';

const REPORT_CATEGORIES = ['Stalled work', 'Quality concern', 'Safety concern', 'Incorrect project information', 'Other'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ message: 'A valid project ID is required.' }, { status: 400 });
    }

    await dbConnect();
    const reports = await DevelopmentReport.find({ projectId, status: 'Approved' })
      .select('category description createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch public project reports:', error);
    return NextResponse.json({ message: 'Failed to fetch project reports.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Sign in is required to submit a project report.' }, { status: 401 });
    }
    const { projectId, category, description } = await request.json();
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    if (!mongoose.Types.ObjectId.isValid(projectId) || !REPORT_CATEGORIES.includes(category) || cleanDescription.length < 10 || cleanDescription.length > 1000) {
      return NextResponse.json({ message: 'Select a report category and enter 10 to 1,000 characters.' }, { status: 400 });
    }

    await dbConnect();
    const project = await Development.findById(projectId).select('_id');
    if (!project) return NextResponse.json({ message: 'Project not found.' }, { status: 404 });

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todayCount = await DevelopmentReport.countDocuments({
      projectId,
      userId: session.user.id,
      createdAt: { $gte: dayStart }
    });
    if (todayCount >= 3) {
      return NextResponse.json({ message: 'Daily report limit reached for this project.' }, { status: 429 });
    }

    const report = await DevelopmentReport.create({
      projectId,
      userId: session.user.id,
      category,
      description: cleanDescription
    });
    return NextResponse.json({ message: 'Report submitted for admin review.', reportId: report._id }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit project report:', error);
    return NextResponse.json({ message: 'Failed to submit project report.' }, { status: 500 });
  }
}
