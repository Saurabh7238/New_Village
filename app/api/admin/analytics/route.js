import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import Application from '@/models/Application';
import Query from '@/models/Query';
import Appointment from '@/models/Appointment';

export async function GET(req) {
  try {
    // Check admin authentication
    const session = await adminAuth(req);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Application statistics
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'Under Review' });
    const approvedApplications = await Application.countDocuments({ status: 'Approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'Rejected' });
    const completedApplications = await Application.countDocuments({ status: 'Completed' });
    const needDocumentsApplications = await Application.countDocuments({ status: 'Need Documents' });

    // Applications by type
    const applicationsByType = await Application.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Query (grievance) statistics
    const totalQueries = await Query.countDocuments();
    const openQueries = await Query.countDocuments({ status: 'Open' });
    const resolvedQueries = await Query.countDocuments({ status: 'Resolved' });
    const inProgressQueries = await Query.countDocuments({ status: 'In Progress' });

    // Queries by category
    const queriesByCategory = await Query.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'Pending' });
    const approvedAppointments = await Appointment.countDocuments({ status: 'Approved' });
    const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'Cancelled' });

    // Last 30 days trends
    const applicationTrends = await Application.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const queryTrends = await Query.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Average processing time (for completed applications)
    const avgProcessingTime = await Application.aggregate([
      {
        $match: { status: 'Completed', completedAt: { $exists: true } },
      },
      {
        $project: {
          processingTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$processingTime' },
        },
      },
    ]);

    return Response.json({
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        completed: completedApplications,
        needDocuments: needDocumentsApplications,
        byType: applicationsByType,
      },
      queries: {
        total: totalQueries,
        open: openQueries,
        resolved: resolvedQueries,
        inProgress: inProgressQueries,
        byCategory: queriesByCategory,
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        approved: approvedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
      trends: {
        applications: applicationTrends,
        queries: queryTrends,
      },
      processingMetrics: {
        avgDaysPerApplication: avgProcessingTime[0]?.avgDays || 0,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
