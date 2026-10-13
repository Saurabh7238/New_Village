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
import { INFRA_TYPES } from '@/lib/infrastructureDisplay';

export const dynamic = 'force-dynamic';

const ACTIONABLE_APPLICATION_STATUSES = ['Submitted', 'Under Review', 'Updated'];
const CLOSED_QUERY_STATUSES = ['Resolved', 'Rejected', 'Closed'];
const RESOLVED_QUERY_STATUSES = ['Resolved', 'Closed'];

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const [
      applicationCounts,
      queryCounts,
      appointmentCounts,
      infrastructureTypeCounts,
      voterRecords,
      budgets,
      funds,
      developmentProjects,
      publishedNotices,
    ] = await Promise.all([
      Application.aggregate([{
        $group: {
          _id: null,
          actionableApplications: {
            $sum: { $cond: [{ $in: ['$status', ACTIONABLE_APPLICATION_STATUSES] }, 1, 0] },
          },
          approvedCertificates: {
            $sum: {
              $cond: [{
                $and: [
                  { $in: ['$serviceType', ['birth-certificate', 'death-certificate']] },
                  { $in: ['$status', ['Approved', 'Completed']] },
                ],
              }, 1, 0],
            },
          },
          birthCertificateQueue: {
            $sum: {
              $cond: [{
                $and: [
                  { $eq: ['$serviceType', 'birth-certificate'] },
                  { $in: ['$status', ACTIONABLE_APPLICATION_STATUSES] },
                ],
              }, 1, 0],
            },
          },
          deathCertificateQueue: {
            $sum: {
              $cond: [{
                $and: [
                  { $eq: ['$serviceType', 'death-certificate'] },
                  { $in: ['$status', ACTIONABLE_APPLICATION_STATUSES] },
                ],
              }, 1, 0],
            },
          },
          aadhaarRequests: {
            $sum: {
              $cond: [{
                $and: [
                  { $eq: ['$serviceType', 'aadhaar-request'] },
                  { $in: ['$status', ACTIONABLE_APPLICATION_STATUSES] },
                ],
              }, 1, 0],
            },
          },
          voterRequests: {
            $sum: {
              $cond: [{
                $and: [
                  { $eq: ['$serviceType', 'voter-request'] },
                  { $in: ['$status', ACTIONABLE_APPLICATION_STATUSES] },
                ],
              }, 1, 0],
            },
          },
        },
      }]),
      Query.aggregate([{
        $group: {
          _id: null,
          totalQueries: { $sum: 1 },
          resolvedQueries: {
            $sum: { $cond: [{ $in: ['$status', RESOLVED_QUERY_STATUSES] }, 1, 0] },
          },
          openQueries: {
            $sum: { $cond: [{ $in: ['$status', CLOSED_QUERY_STATUSES] }, 0, 1] },
          },
        },
      }]),
      Appointment.aggregate([{
        $group: {
          _id: null,
          upcomingAppointments: {
            $sum: {
              $cond: [{
                $and: [
                  { $eq: ['$archivedAt', null] },
                  { $in: ['$status', ['Approved', 'Rescheduled']] },
                  {
                    $or: [
                      { $gte: ['$scheduledDate', now] },
                      {
                        $and: [
                          { $eq: ['$scheduledDate', null] },
                          { $gte: ['$appointmentDate', now] },
                        ],
                      },
                    ],
                  },
                ],
              }, 1, 0],
            },
          },
          pendingAppointments: {
            $sum: {
              $cond: [{
                $and: [
                  { $eq: ['$archivedAt', null] },
                  { $eq: ['$status', 'Pending'] },
                ],
              }, 1, 0],
            },
          },
        },
      }]),
      Infrastructure.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      VoterData.countDocuments({ type: 'gram-panchayat' }),
      Budget.countDocuments(),
      Fund.countDocuments(),
      Development.countDocuments(),
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

    const applicationStats = applicationCounts[0] || {};
    const queryStats = queryCounts[0] || { totalQueries: 0, resolvedQueries: 0, openQueries: 0 };
    const appointmentStats = appointmentCounts[0] || { upcomingAppointments: 0, pendingAppointments: 0 };
    const infrastructureCounts = Object.fromEntries(INFRA_TYPES.map((type) => [type, 0]));
    let infrastructureAssets = 0;
    for (const item of infrastructureTypeCounts) {
      infrastructureAssets += item.count;
      if (Object.hasOwn(infrastructureCounts, item._id)) {
        infrastructureCounts[item._id] = item.count;
      }
    }

    return NextResponse.json({
      updatedAt: now.toISOString(),
      metrics: {
        actionableApplications: applicationStats.actionableApplications || 0,
        approvedCertificates: applicationStats.approvedCertificates || 0,
        grievanceResolutionRate: queryStats.totalQueries
          ? Math.round((queryStats.resolvedQueries / queryStats.totalQueries) * 100)
          : null,
        upcomingAppointments: appointmentStats.upcomingAppointments,
      },
      queue: {
        birthCertificateQueue: applicationStats.birthCertificateQueue || 0,
        deathCertificateQueue: applicationStats.deathCertificateQueue || 0,
        openQueries: queryStats.openQueries,
        pendingAppointments: appointmentStats.pendingAppointments,
      },
      services: {
        totalQueries: queryStats.totalQueries,
        aadhaarRequests: applicationStats.aadhaarRequests || 0,
        voterRequests: applicationStats.voterRequests || 0,
        voterRecords,
        budgets,
        funds,
        developmentProjects,
        infrastructureAssets,
        publishedNotices,
      },
      infrastructureCounts,
    });
  } catch (error) {
    console.error('Homepage statistics fetch error:', error);
    return NextResponse.json({ message: 'Unable to load homepage statistics.' }, { status: 500 });
  }
}
