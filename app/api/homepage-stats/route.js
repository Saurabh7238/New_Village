import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Application from '@/models/Application';
import Appointment from '@/models/Appointment';
import Query from '@/models/Query';
import Budget from '@/models/Budget';
import Development from '@/models/Development';
import Fund from '@/models/Fund';
import Infrastructure from '@/models/Infrastructure';
import NotificationBoard from '@/models/NotificationBoard';
import VoterData from '@/models/VoterData';

export const dynamic = 'force-dynamic';

const ACTIONABLE_APPLICATION_STATUSES = ['Submitted', 'Under Review', 'Updated'];
const CLOSED_QUERY_STATUSES = ['Resolved', 'Rejected', 'Closed'];

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const [
      actionableApplications,
      approvedCertificates,
      totalQueries,
      resolvedQueries,
      upcomingAppointments,
      birthCertificateQueue,
      deathCertificateQueue,
      openQueries,
      pendingAppointments,
      aadhaarRequests,
      voterRequests,
      voterRecords,
      budgets,
      funds,
      developmentProjects,
      infrastructureAssets,
      publishedNotices,
    ] = await Promise.all([
      Application.countDocuments({ status: { $in: ACTIONABLE_APPLICATION_STATUSES } }),
      Application.countDocuments({
        serviceType: { $in: ['birth-certificate', 'death-certificate'] },
        status: { $in: ['Approved', 'Completed'] },
      }),
      Query.countDocuments(),
      Query.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
      Appointment.countDocuments({
        archivedAt: null,
        status: { $in: ['Approved', 'Rescheduled'] },
        $or: [
          { scheduledDate: { $gte: now } },
          { scheduledDate: null, appointmentDate: { $gte: now } },
        ],
      }),
      Application.countDocuments({
        serviceType: 'birth-certificate',
        status: { $in: ACTIONABLE_APPLICATION_STATUSES },
      }),
      Application.countDocuments({
        serviceType: 'death-certificate',
        status: { $in: ACTIONABLE_APPLICATION_STATUSES },
      }),
      Query.countDocuments({ status: { $nin: CLOSED_QUERY_STATUSES } }),
      Appointment.countDocuments({ archivedAt: null, status: 'Pending' }),
      Application.countDocuments({
        serviceType: 'aadhaar-request',
        status: { $in: ACTIONABLE_APPLICATION_STATUSES },
      }),
      Application.countDocuments({
        serviceType: 'voter-request',
        status: { $in: ACTIONABLE_APPLICATION_STATUSES },
      }),
      VoterData.countDocuments({ type: 'gram-panchayat' }),
      Budget.countDocuments(),
      Fund.countDocuments(),
      Development.countDocuments(),
      Infrastructure.countDocuments(),
      NotificationBoard.countDocuments({
        status: 'published',
        $or: [{ validTill: null }, { validTill: { $gt: now } }],
        $and: [{
          $or: [
            { scheduledPublishDate: null },
            { scheduledPublishDate: { $lte: now } },
          ],
        }],
      }),
    ]);

    return NextResponse.json({
      updatedAt: now.toISOString(),
      metrics: {
        actionableApplications,
        approvedCertificates,
        grievanceResolutionRate: totalQueries
          ? Math.round((resolvedQueries / totalQueries) * 100)
          : null,
        upcomingAppointments,
      },
      queue: {
        birthCertificateQueue,
        deathCertificateQueue,
        openQueries,
        pendingAppointments,
      },
      services: {
        totalQueries,
        aadhaarRequests,
        voterRequests,
        voterRecords,
        budgets,
        funds,
        developmentProjects,
        infrastructureAssets,
        publishedNotices,
      },
    });
  } catch (error) {
    console.error('Homepage statistics fetch error:', error);
    return NextResponse.json({ message: 'Unable to load homepage statistics.' }, { status: 500 });
  }
}
