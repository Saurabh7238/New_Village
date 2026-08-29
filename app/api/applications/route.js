import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import User from '@/models/User';
import CitizenNotification from '@/models/CitizenNotification';
import AdminNotification from '@/models/AdminNotification';
import ServiceNotification from '@/models/ServiceNotification';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

const SERVICE_TYPES = ['birth-certificate', 'death-certificate', 'aadhaar-request', 'voter-request', 'other'];
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

function validateDocuments(documents) {
  if (!Array.isArray(documents)) return [];
  if (documents.length > 5) throw new Error('You can upload up to five documents.');
  return documents.map((document) => {
    if (!document || typeof document.fileName !== 'string' || typeof document.fileUrl !== 'string' || !ALLOWED_MIME_TYPES.has(document.mimeType)) {
      throw new Error('Only PDF, JPG, and PNG documents are allowed.');
    }
    // Base64 data is stored only on the authenticated request record and is size-limited.
    if (!document.fileUrl.startsWith(`data:${document.mimeType};base64,`) || document.fileUrl.length > MAX_DOCUMENT_BYTES * 1.37) {
      throw new Error('Each document must be smaller than 5 MB.');
    }
    return { fileName: document.fileName.slice(0, 150), fileUrl: document.fileUrl, mimeType: document.mimeType };
  });
}

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to view your applications.' }, { status: 401 });
  await connectDB();
  const applications = await Application.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .select('applicationNumber serviceType status formData documents adminDocuments requestedDocuments adminRemarks createdAt updatedAt')
    .lean();
  return NextResponse.json({ applications: applications.map((item) => ({ ...item, id: item._id.toString() })) });
}

export async function POST(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to submit an application.' }, { status: 401 });
  try {
    const { serviceType, formData = {}, documents = [] } = await request.json();
    if (!SERVICE_TYPES.includes(serviceType)) return NextResponse.json({ message: 'Invalid service type.' }, { status: 400 });
    await connectDB();
    const user = await User.findById(session.user.id).select('name email phone aadhaarLast4 status').lean();
    if (!user || (user.status && user.status !== 'active')) return NextResponse.json({ message: 'Your account is unavailable.' }, { status: 403 });
    const safeDocuments = validateDocuments(documents);
    const applicationNumber = `APP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const application = await Application.create({
      applicationNumber,
      userId: user._id,
      serviceType,
      // Identity comes from the authenticated profile, never from client supplied IDs.
      formData: { ...formData, applicant: { name: user.name, email: user.email || '', phone: user.phone, aadhaarLast4: user.aadhaarLast4 || null } },
      documents: safeDocuments,
    });
    await ServiceNotification.create({ userId: user._id, serviceType, relatedType: 'application', relatedId: application._id, queryRaised: application.createdAt });
    await CitizenNotification.create({ userId: user._id, title: `${applicationNumber} submitted`, message: 'Your application has been submitted for review.', type: 'application', relatedType: 'application', relatedId: application._id });
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id').lean();
    if (admins.length) {
      await AdminNotification.insertMany(admins.map((admin) => ({
        userId: admin._id,
        title: `New service application: ${applicationNumber}`,
        message: `${user.name} submitted a ${serviceType.replace(/-/g, ' ')} request.`,
        relatedType: 'application',
        relatedId: application._id,
      })));
    }
    return NextResponse.json({ message: 'Application submitted successfully.', applicationNumber, id: application._id.toString(), createdAt: application.createdAt }, { status: 201 });
  } catch (error) {
    console.error('Application creation error:', error);
    return NextResponse.json({ message: error.message || 'Unable to submit the application.' }, { status: 400 });
  }
}
