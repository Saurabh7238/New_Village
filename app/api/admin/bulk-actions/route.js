import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import Application from '@/models/Application';
import Query from '@/models/Query';
import { sendTrackedEmail } from '@/lib/trackedEmail';

export async function PATCH(req) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { entityType, ids, action, updates } = await req.json();

    if (!entityType || !ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const Model = entityType === 'applications' ? Application : Query;

    if (action === 'updateStatus') {
      const previousRecords = await Model.find({ _id: { $in: ids } })
        .select('applicationNumber serviceType queryId status adminRemarks userId')
        .lean();
      const result = await Model.updateMany(
        { _id: { $in: ids } },
        {
          status: updates.status,
          updatedBy: session.user.name,
          ...(updates.remarks && { adminRemarks: updates.remarks }),
        }
      );
      if (result.modifiedCount > 0) {
        const updatedRecords = await Model.find({ _id: { $in: ids } })
          .select('applicationNumber serviceType queryId status adminRemarks userId updatedAt')
          .lean();
        const previousById = new Map(previousRecords.map((record) => [record._id.toString(), record]));
        await Promise.all(updatedRecords.map(async (record) => {
          const previous = previousById.get(record._id.toString());
          const responseChanged = previous && (
            previous.status !== record.status
            || previous.adminRemarks !== record.adminRemarks
          );
          if (!responseChanged || !record.userId) return;

          const isApplication = entityType === 'applications';
          const reference = isApplication ? record.applicationNumber : record.queryId;
          const subjectPrefix = isApplication ? 'Application' : 'Grievance';
          const category = isApplication ? 'application' : 'grievance';
          const details = isApplication
            ? `Your ${record.serviceType.replace(/-/g, ' ')} application ${reference}`
            : `Your grievance ${reference}`;
          await sendTrackedEmail({
            userId: record.userId,
            category,
            eventKey: `${category}:${record._id}:response:${record.updatedAt.toISOString()}`,
            relatedType: isApplication ? 'application' : 'query',
            relatedId: record._id,
            subject: `${subjectPrefix} ${reference} update`,
            text: `${details} is now ${record.status}.${record.adminRemarks ? `\n\nAdministrator response: ${record.adminRemarks}` : ''}\n\nSign in to the Chiutahara Portal to view the latest details.`,
          });
        }));
      }
      return Response.json({ modifiedCount: result.modifiedCount });
    }

    if (action === 'delete') {
      const result = await Model.deleteMany({ _id: { $in: ids } });
      return Response.json({ deletedCount: result.deletedCount });
    }

    if (action === 'assignTo') {
      const result = await Model.updateMany(
        { _id: { $in: ids } },
        {
          assignedTo: updates.assignee,
          updatedBy: session.user.name,
        }
      );
      return Response.json({ modifiedCount: result.modifiedCount });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk action error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
