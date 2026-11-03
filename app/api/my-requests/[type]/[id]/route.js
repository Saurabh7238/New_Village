import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import Appointment from '@/models/Appointment';
import Query from '@/models/Query';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

const REQUEST_TYPES = new Set(['application', 'appointment', 'query']);

export async function GET(_request, { params }) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to view this request.' }, { status: 401 });

  const { type, id } = await params;
  if (!REQUEST_TYPES.has(type) || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'A valid request is required.' }, { status: 400 });
  }

  try {
    await connectDB();
    const filter = { _id: id, userId: session.user.id };
    const request = type === 'application'
      ? await Application.findOne(filter)
        .select('applicationNumber serviceType status formData documents adminDocuments requestedDocuments adminRemarks statusHistory createdAt updatedAt')
        .lean()
      : type === 'appointment'
        ? await Appointment.findOne({ ...filter, archivedAt: null })
          .select('appointmentNumber service purpose status adminRemarks appointmentDate appointmentTime scheduledDate scheduledTime statusHistory createdAt updatedAt')
          .lean()
        : await Query.findOne(filter)
          .select('queryId category subject description ward status priority adminRemarks resolutionPhoto attachments statusHistory auditLog createdAt updatedAt resolvedAt')
          .lean();

    if (!request) return NextResponse.json({ message: 'Request not found.' }, { status: 404 });
    return NextResponse.json({
      request: {
        ...request,
        id: request._id.toString(),
        type,
      },
    });
  } catch (error) {
    console.error('Failed to load citizen request details:', error);
    return NextResponse.json({ message: 'Unable to load request details.' }, { status: 500 });
  }
}
