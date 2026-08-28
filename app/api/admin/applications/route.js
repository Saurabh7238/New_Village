import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import CitizenNotification from '@/models/CitizenNotification';
import ServiceNotification from '@/models/ServiceNotification';
import { requireAdminSession } from '@/lib/adminAuth';

const STATUSES = ['Submitted', 'Under Review', 'Need Documents', 'Approved', 'Rejected', 'Completed'];
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

function validateDocuments(documents) {
  if (!Array.isArray(documents)) return [];
  if (documents.length > 5) throw new Error('You can upload up to five documents.');
  return documents.map((document) => {
    if (!document || typeof document.fileName !== 'string' || typeof document.fileUrl !== 'string' || !ALLOWED_MIME_TYPES.has(document.mimeType)) throw new Error('Only PDF, JPG, and PNG documents are allowed.');
    if (!document.fileUrl.startsWith(`data:${document.mimeType};base64,`) || document.fileUrl.length > MAX_DOCUMENT_BYTES * 1.37) throw new Error('Each document must be smaller than 5 MB.');
    return { fileName: document.fileName.slice(0, 150), fileUrl: document.fileUrl, mimeType: document.mimeType };
  });
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  await connectDB();
  const applications = await Application.find({})
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .select('applicationNumber serviceType status formData documents adminDocuments adminRemarks userId createdAt updatedAt')
    .lean();
  return NextResponse.json({ applications: applications.map((application) => ({ ...application, id: application._id.toString() })) });
}

export async function PUT(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const { id, status, adminRemarks = '', adminDocuments } = await request.json();
    if (!id || !STATUSES.includes(status)) return NextResponse.json({ message: 'A valid application and status are required.' }, { status: 400 });

    await connectDB();
    const application = await Application.findById(id);
    if (!application) return NextResponse.json({ message: 'Application not found.' }, { status: 404 });

    const statusChanged = application.status !== status;
    const nextRemarks = String(adminRemarks).slice(0, 2000);
    const remarksChanged = application.adminRemarks !== nextRemarks;
    const nextAdminDocuments = adminDocuments === undefined ? application.adminDocuments : validateDocuments(adminDocuments);
    const documentsChanged = JSON.stringify(application.adminDocuments || []) !== JSON.stringify(nextAdminDocuments || []);
    application.status = status;
    application.adminRemarks = nextRemarks;
    application.adminDocuments = nextAdminDocuments;
    application.reviewedBy = session.user.id;
    await application.save();

    if (statusChanged || remarksChanged || documentsChanged) {
      await ServiceNotification.findOneAndUpdate(
        { relatedType: 'application', relatedId: application._id },
        { $set: { adminResponded: new Date(), isRead: false } },
      );
      await CitizenNotification.create({
        userId: application.userId,
        title: `Application ${status}`,
        message: application.adminRemarks || (documentsChanged ? 'Panchayat office added a document to your application.' : `Your application ${application.applicationNumber} has been ${status.toLowerCase()}.`),
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

export async function DELETE(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ message: 'Application ID is required.' }, { status: 400 });
    await connectDB();
    const application = await Application.findByIdAndDelete(id);
    if (!application) return NextResponse.json({ message: 'Application not found.' }, { status: 404 });
    await ServiceNotification.deleteOne({ relatedType: 'application', relatedId: application._id });
    await CitizenNotification.deleteMany({ userId: application.userId, relatedType: 'application', relatedId: application._id });
    return NextResponse.json({ message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('Admin application delete error:', error);
    return NextResponse.json({ message: 'Unable to delete application.' }, { status: 500 });
  }
}
