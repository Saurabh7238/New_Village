import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import Application from '@/models/Application';
import Query from '@/models/Query';

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
      const result = await Model.updateMany(
        { _id: { $in: ids } },
        {
          status: updates.status,
          updatedBy: session.user.name,
          ...(updates.remarks && { adminRemarks: updates.remarks }),
        }
      );
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
