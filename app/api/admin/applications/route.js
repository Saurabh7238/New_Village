import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import CitizenNotification from '@/models/CitizenNotification';
import { requireAdminSession } from '@/lib/adminAuth';

const STATUSES = ['Submitted', 'Under Review', 'Need Documents', 'Approved', 'Rejected', 'Completed'];

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  await connectDB();
  const applications = await Application.find({})
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .select('applicationNumber serviceType status formData documents adminRemarks userId createdAt updatedAt')
    .lean();
  return NextResponse.json({ applications: applications.map((application) => ({ ...application, id: application._id.toString() })) });
}

export async function PUT(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const { id, status, adminRemarks = '' } = await request.json();
    if (!id || !STATUSES.includes(status)) return NextResponse.json({ message: 'A valid application and status are required.' }, { status: 400 });

    await connectDB();
    const application = await Application.findById(id);
    if (!application) return NextResponse.json({ message: 'Application not found.' }, { status: 404 });

    const statusChanged = application.status !== status;
    application.status = status;
    application.adminRemarks = String(adminRemarks).slice(0, 2000);
    application.reviewedBy = session.user.id;
    await application.save();

    if (statusChanged) {
      await CitizenNotification.create({
        userId: application.userId,
        title: `Application ${status}`,
        message: application.adminRemarks || `Your application ${application.applicationNumber} has been ${status.toLowerCase()}.`,
        type: 'application',
        relatedType: 'application',
        relatedId: application._id,
      });
    }

    return NextResponse.json({ message: 'Application updated successfully.' });
  } catch (error) {
    console.error('Admin application update error:', error);
    return NextResponse.json({ message: 'Unable to update application.' }, { status: 500 });
  }
}
