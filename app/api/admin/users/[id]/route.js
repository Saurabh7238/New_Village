import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import User from '@/models/User';
import Application from '@/models/Application';
import Appointment from '@/models/Appointment';
import Query from '@/models/Query';
import VoterData from '@/models/VoterData';
import CitizenDocument from '@/models/CitizenDocument';
import Chat from '@/models/Chat';
import { requireAdminSession } from '@/lib/adminAuth';

const documentMetadata = (documents = [], applicationId, kind) => documents.map((document, index) => ({
  fileName: document.fileName,
  mimeType: document.mimeType,
  uploadedAt: document.uploadedAt,
  viewUrl: `/api/admin/applications/${applicationId}/documents?kind=${kind}&index=${index}`,
}));

export async function GET(_request, { params }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid user ID.' }, { status: 400 });

  await connectDB();
  const user = await User.findById(id).select('-password -aadhaarHash').lean();
  if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });

  const [applications, appointments, queries, documents, voterRecords, chats] = await Promise.all([
    Application.find({ userId: id }).sort({ createdAt: -1 }).select('applicationNumber serviceType status formData documents adminDocuments adminRemarks createdAt updatedAt').lean(),
    Appointment.find({ userId: id }).sort({ appointmentDate: -1 }).select('appointmentNumber service appointmentDate appointmentTime scheduledDate scheduledTime purpose status adminRemarks createdAt').lean(),
    Query.find({ userId: id }).sort({ createdAt: -1 }).select('queryId category subject status priority description adminRemarks createdAt updatedAt').lean(),
    CitizenDocument.find({ userId: id }).sort({ createdAt: -1 }).select('fileName mimeType documentType uploadedBy source applicationId createdAt').lean(),
    VoterData.find({ $or: [{ elector_name: new RegExp(`^${user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, { name: new RegExp(`^${user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, ...(user.fatherName ? [{ parent_name: new RegExp(user.fatherName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] : [])] }).limit(50).lean(),
    Chat.find({ userId: user.email }).sort({ createdAt: -1 }).limit(100).select('message sender service createdAt').lean(),
  ]);

  return NextResponse.json({
    user: { ...user, id: user._id.toString(), aadhaar: user.aadhaarLast4 ? `XXXX-XXXX-${user.aadhaarLast4}` : 'Not available' },
    applications: applications.map((application) => ({ ...application, id: application._id.toString(), documents: documentMetadata(application.documents, application._id, 'citizen'), adminDocuments: documentMetadata(application.adminDocuments, application._id, 'panchayat') })),
    appointments: appointments.map((item) => ({ ...item, id: item._id.toString() })),
    queries: queries.map((item) => ({ ...item, id: item._id.toString() })),
    documents: documents.map((document) => ({ ...document, id: document._id.toString(), viewUrl: `/api/admin/citizen-documents/${document._id}` })),
    voterRecords,
    chats,
  });
}
