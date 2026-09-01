import { connectDB } from '@/lib/dbConnect';
import { adminAuth } from '@/lib/adminAuth';
import Escalation from '@/models/Escalation';
import Query from '@/models/Query';

export async function POST(req) {
  try {
    const session = await adminAuth(req);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { queryId, applicationId, reason } = await req.json();

    // Check if already escalated
    const existing = await Escalation.findOne({ queryId, status: { $ne: 'resolved' } });
    if (existing) {
      return Response.json({ error: 'Query already escalated' }, { status: 400 });
    }

    // Get the query to check days unresolved
    const query = await Query.findById(queryId);
    const daysUnresolved = Math.floor((new Date() - new Date(query.createdAt)) / (1000 * 60 * 60 * 24));

    // Auto-escalate if unresolved for 7+ days
    const shouldAutoEscalate = daysUnresolved >= 7;

    const escalation = await Escalation.create({
      queryId,
      applicationId,
      reason: reason || 'Unresolved for extended period',
      escalationLevel: shouldAutoEscalate ? 2 : 1,
      escalatedBy: session.user.name,
      daysUnresolved,
      status: 'pending',
    });

    // Update query status
    await Query.findByIdAndUpdate(queryId, { escalated: true, escalationId: escalation._id });

    return Response.json(escalation, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await adminAuth(req);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const escalations = await Escalation.find({ status: { $ne: 'resolved' } })
      .populate('queryId', 'title category')
      .sort({ escalationLevel: -1, createdAt: -1 });

    return Response.json(escalations);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
