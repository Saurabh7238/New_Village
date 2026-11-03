import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import Appointment from '@/models/Appointment';
import Query from '@/models/Query';
import ChatTicket from '@/models/ChatTicket';
import Review from '@/models/Review';
import { requireAdminSession } from '@/lib/adminAuth';

function summarizeStatuses(rows, newStatuses, dueStatuses) {
  const counts = rows.reduce((result, row) => {
    result.all += row.count;
    if (newStatuses.includes(row._id)) result.new += row.count;
    if (dueStatuses.includes(row._id)) result.due += row.count;
    return result;
  }, { new: 0, due: 0, all: 0 });
  return counts;
}

async function groupStatuses(Model, filter = {}) {
  return Model.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    await connectDB();
    const activeApplications = ['Submitted', 'Under Review', 'Need Documents', 'Updated'];
    const activeQueries = ['New', 'Pending', 'Acknowledged', 'In Review', 'In Progress', 'Need More Information'];
    const activeTickets = ['Open', 'In Progress'];
    const activeAppointments = { archivedAt: null };

    const [
      applicationRows,
      appointmentRows,
      queryRows,
      chatTicketRows,
      reviewRows,
      applicationGroups,
    ] = await Promise.all([
      groupStatuses(Application),
      groupStatuses(Appointment, activeAppointments),
      groupStatuses(Query),
      groupStatuses(ChatTicket),
      groupStatuses(Review),
      Application.aggregate([
        { $group: { _id: { serviceType: '$serviceType', status: '$status' }, count: { $sum: 1 } } },
      ]),
    ]);

    const applicationsByType = {};
    for (const row of applicationGroups) {
      const { serviceType, status } = row._id;
      applicationsByType[serviceType] ??= { new: 0, due: 0, all: 0 };
      applicationsByType[serviceType].all += row.count;
      if (status === 'Submitted') applicationsByType[serviceType].new += row.count;
      if (activeApplications.includes(status)) applicationsByType[serviceType].due += row.count;
    }

    return NextResponse.json({
      applications: {
        ...summarizeStatuses(applicationRows, ['Submitted'], activeApplications),
        byType: applicationsByType,
      },
      appointments: summarizeStatuses(appointmentRows, ['Pending'], ['Pending']),
      queries: summarizeStatuses(queryRows, ['New', 'Pending'], activeQueries),
      chatTickets: summarizeStatuses(chatTicketRows, ['Open'], activeTickets),
      reviews: summarizeStatuses(reviewRows, ['pending'], ['pending']),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin request count load failed:', error);
    return NextResponse.json({ message: 'Unable to load request counts.' }, { status: 500 });
  }
}
