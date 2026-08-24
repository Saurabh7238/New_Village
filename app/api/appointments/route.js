import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import CitizenNotification from '@/models/CitizenNotification';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to view appointments.' }, { status: 401 });
  await connectDB();
  const appointments = await Appointment.find({ userId: session.user.id }).sort({ appointmentDate: -1 }).lean();
  return NextResponse.json({ appointments: appointments.map((item) => ({ ...item, id: item._id.toString() })) });
}

export async function POST(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to book an appointment.' }, { status: 401 });
  try {
    const { appointmentDate, appointmentTime, purpose } = await request.json();
    if (!appointmentDate || !appointmentTime || !purpose?.trim()) return NextResponse.json({ message: 'Date, time, and purpose are required.' }, { status: 400 });
    const date = new Date(appointmentDate);
    if (Number.isNaN(date.getTime()) || date < new Date(new Date().setHours(0, 0, 0, 0))) return NextResponse.json({ message: 'Please choose a future appointment date.' }, { status: 400 });
    await connectDB();
    const user = await User.findById(session.user.id).select('status').lean();
    // Older accounts predate the status field; they are active unless explicitly disabled.
    if (!user || (user.status && user.status !== 'active')) return NextResponse.json({ message: 'Your account is unavailable.' }, { status: 403 });
    const appointmentNumber = `APT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const appointment = await Appointment.create({ appointmentNumber, userId: user._id, service: 'General Panchayat Appointment', appointmentDate: date, appointmentTime: appointmentTime.slice(0, 30), purpose: purpose.trim() });
    await CitizenNotification.create({ userId: user._id, title: `${appointmentNumber} booked`, message: 'Your appointment request is pending approval.', type: 'appointment', relatedType: 'appointment', relatedId: appointment._id });
    return NextResponse.json({ message: 'Appointment requested successfully.', appointmentNumber, id: appointment._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('Appointment creation error:', error);
    return NextResponse.json({ message: 'Unable to book the appointment.' }, { status: 500 });
  }
}
