import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import CitizenNotification from '@/models/CitizenNotification';
import ServiceNotification from '@/models/ServiceNotification';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to view appointments.' }, { status: 401 });
  await connectDB();
  const appointments = await Appointment.find({ userId: session.user.id, archivedAt: null }).sort({ appointmentDate: -1 }).lean();
  return NextResponse.json({ appointments: appointments.map((item) => ({ ...item, id: item._id.toString() })) });
}

export async function POST(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to book an appointment.' }, { status: 401 });
  try {
    const { purpose } = await request.json();
    if (!purpose?.trim()) return NextResponse.json({ message: 'Please enter the purpose of your appointment.' }, { status: 400 });
    await connectDB();
    const user = await User.findById(session.user.id).select('status').lean();
    // Older accounts predate the status field; they are active unless explicitly disabled.
    if (!user || (user.status && user.status !== 'active')) return NextResponse.json({ message: 'Your account is unavailable.' }, { status: 403 });
    const previousBooking = await Appointment.findOne({ userId: user._id, archivedAt: null, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).select('_id').lean();
    if (previousBooking) return NextResponse.json({ message: 'You can book your next appointment 24 hours after your previous booking.' }, { status: 429 });
    const appointmentNumber = `APT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const appointment = await Appointment.create({ appointmentNumber, userId: user._id, service: 'General Panchayat Appointment', appointmentDate: new Date(), appointmentTime: 'Pending scheduling', purpose: purpose.trim() });
    await writeAuditLog({ session, action: 'Appointment requested', details: { appointmentId: appointment._id.toString(), appointmentNumber } });
    await ServiceNotification.create({ userId: user._id, serviceType: 'appointment', relatedType: 'appointment', relatedId: appointment._id, queryRaised: appointment.createdAt });
    await CitizenNotification.create({ userId: user._id, title: `${appointmentNumber} booked`, message: 'Your request has been sent to the Panchayat office. The administrator will set your date and time.', type: 'appointment', relatedType: 'appointment', relatedId: appointment._id });
    return NextResponse.json({ message: 'Appointment requested successfully.', appointmentNumber, id: appointment._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('Appointment creation error:', error);
    return NextResponse.json({ message: 'Unable to book the appointment.' }, { status: 500 });
  }
}
