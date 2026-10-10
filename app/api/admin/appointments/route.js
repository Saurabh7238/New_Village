import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Appointment from '@/models/Appointment';
import CitizenNotification from '@/models/CitizenNotification';
import ServiceNotification from '@/models/ServiceNotification';
import { requireAdminSession } from '@/lib/adminAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Rescheduled', 'Cancelled', 'Completed'];

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
    const archived = searchParams.get('archived') === 'true';
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const filter = { archivedAt: archived ? { $ne: null } : null };
    if (status && STATUSES.includes(status)) filter.status = status;
    if (search) filter.$or = [{ appointmentNumber: { $regex: search, $options: 'i' } }, { purpose: { $regex: search, $options: 'i' } }];
    const [appointments, total] = await Promise.all([
      Appointment.find(filter).populate('userId', 'name email phone').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Appointment.countDocuments(filter),
    ]);
    return NextResponse.json({ appointments: appointments.map((appointment) => ({ ...appointment, id: appointment._id.toString() })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Admin appointment fetch error:', error);
    return NextResponse.json({ message: 'Unable to load appointments.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  try {
    const { id, status, adminRemarks, scheduledDate, scheduledTime, appointmentDate, appointmentTime } = await request.json();
    if (!id || !STATUSES.includes(status)) return NextResponse.json({ message: 'A valid appointment and status are required.' }, { status: 400 });
    const update = { status, adminRemarks: String(adminRemarks || '').slice(0, 2000), reviewedBy: session.user.id };
    // appointmentDate/time are accepted for compatibility with the existing admin form.
    const chosenDate = scheduledDate || appointmentDate;
    const chosenTime = scheduledTime || appointmentTime;
    if (chosenDate) {
      update.scheduledDate = new Date(chosenDate);
      update.appointmentDate = update.scheduledDate;
    }
    if (chosenTime) {
      update.scheduledTime = String(chosenTime).slice(0, 30);
      update.appointmentTime = update.scheduledTime;
    }
    if (['Approved', 'Rescheduled'].includes(status) && (!update.scheduledDate || !update.scheduledTime)) return NextResponse.json({ message: 'Set a scheduled date and time before approving or rescheduling.' }, { status: 400 });
    await connectDB();
    const appointment = await Appointment.findOneAndUpdate({ _id: id, archivedAt: null }, { ...update, $push: { statusHistory: { status, remarks: update.adminRemarks, changedBy: session.user.id } } }, { new: true, runValidators: true });
    if (!appointment) return NextResponse.json({ message: 'Appointment not found.' }, { status: 404 });
    await writeAuditLog({ session, action: 'Appointment updated', details: { appointmentId: appointment._id.toString(), appointmentNumber: appointment.appointmentNumber, status } });
    await ServiceNotification.findOneAndUpdate(
      { relatedType: 'appointment', relatedId: appointment._id },
      {
        $set: { adminResponded: new Date(), isRead: false },
        $setOnInsert: {
          userId: appointment.userId,
          serviceType: 'appointment',
          queryRaised: appointment.createdAt,
        },
      },
      { upsert: true },
    );
    const schedule = appointment.scheduledDate && appointment.scheduledTime ? ` Scheduled for ${appointment.scheduledDate.toLocaleDateString('en-GB')} at ${appointment.scheduledTime}.` : '';
    await CitizenNotification.create({ userId: appointment.userId, title: `Appointment ${status}`, message: `${update.adminRemarks || `Your appointment ${appointment.appointmentNumber} is ${status.toLowerCase()}.`}${schedule}`, type: 'appointment', relatedType: 'appointment', relatedId: appointment._id });
    return NextResponse.json({ message: 'Appointment updated successfully.', appointment });
  } catch (error) {
    console.error('Admin appointment update error:', error);
    return NextResponse.json({ message: 'Unable to update appointment.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: 'Appointment ID is required.' }, { status: 400 });
    }

    await connectDB();
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, archivedAt: null },
      { archivedAt: new Date(), archivedBy: session.user.id },
      { new: true },
    );
    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found.' }, { status: 404 });
    }

    await writeAuditLog({
      session,
      action: 'Appointment archived',
      details: {
        appointmentId: appointment._id.toString(),
        appointmentNumber: appointment.appointmentNumber,
        userId: appointment.userId?.toString?.() || appointment.userId,
      },
    });

    return NextResponse.json({ message: 'Appointment archived successfully.' });
  } catch (error) {
    console.error('Admin appointment delete error:', error);
    return NextResponse.json({ message: 'Unable to delete appointment.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ message: 'Appointment ID is required.' }, { status: 400 });
    await connectDB();
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, archivedAt: { $ne: null } },
      { $set: { archivedAt: null, archivedBy: null } },
      { new: true },
    );
    if (!appointment) return NextResponse.json({ message: 'Archived appointment not found.' }, { status: 404 });
    await writeAuditLog({ session, action: 'Appointment restored', details: { appointmentId: id, appointmentNumber: appointment.appointmentNumber } });
    return NextResponse.json({ message: 'Appointment restored successfully.', appointment });
  } catch (error) {
    console.error('Admin appointment restore error:', error);
    return NextResponse.json({ message: 'Unable to restore appointment.' }, { status: 500 });
  }
}
