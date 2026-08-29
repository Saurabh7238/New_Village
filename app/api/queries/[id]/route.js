import { NextResponse } from 'next/server';
import Query from '@/models/Query';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import { checkSlaBreach } from '@/lib/escalationRules';
import { requireAdminSession } from '@/lib/adminAuth';
import ServiceNotification from '@/models/ServiceNotification';
import CitizenNotification from '@/models/CitizenNotification';
import QueryMessage from '@/models/QueryMessage';
import { writeAuditLog } from '@/lib/writeAuditLog';

export async function GET(request, { params }) {
  await connectDB();

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid query ID format' },
        { status: 400 }
      );
    }

    const query = await Query.findById(id);

    if (!query) {
      return NextResponse.json(
        { message: 'Query not found' },
        { status: 404 }
      );
    }
    await ServiceNotification.updateOne(
      { relatedType: 'query', relatedId: query._id },
      { adminIsRead: true, adminAcknowledgedAt: new Date() }
    );

    const breach = checkSlaBreach(query);
    if (breach.breached && !query.escalate) {
      await Query.findByIdAndUpdate(id, { escalate: true });
      query.escalate = true;
    }

    return NextResponse.json(query, { status: 200 });
  } catch (error) {
    console.error('Query fetch error:', error);
    return NextResponse.json(
      { message: 'Error fetching query' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await connectDB();

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid query ID format' },
        { status: 400 }
      );
    }

    const { status, priority, assignedTo, adminRemarks, internalNotes, escalate, resolutionPhoto, auditEntry } = await request.json();

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (adminRemarks !== undefined) updateData.adminRemarks = adminRemarks;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (escalate !== undefined) updateData.escalate = escalate;
    if (resolutionPhoto) updateData.resolutionPhoto = resolutionPhoto;

    if (status === 'Acknowledged' && !updateData.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
    }
    if (status === 'Resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (auditEntry) {
      updateData.$push = {
        auditLog: {
          action: auditEntry.action,
          changedBy: auditEntry.changedBy,
          from: status ? 'previous' : null,
          to: status || null,
          timestamp: new Date()
        }
      };
    }

    const query = await Query.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!query) {
      return NextResponse.json(
        { message: 'Query not found' },
        { status: 404 }
      );
    }
    await writeAuditLog({ session, action: 'Query updated', details: { queryId: query._id.toString(), publicQueryId: query.queryId, status: query.status, priority: query.priority, assignedTo: query.assignedTo } });
    if (adminRemarks !== undefined || status) {
      await ServiceNotification.findOneAndUpdate(
        { relatedType: 'query', relatedId: query._id },
        {
          $set: { adminResponded: new Date(), isRead: false },
          $setOnInsert: {
            userId: query.userId,
            serviceType: `query:${query.category}`,
            queryRaised: query.createdAt,
          },
        },
        { upsert: true },
      );
      await CitizenNotification.create({ userId: query.userId, title: `Query ${query.queryId} updated`, message: query.adminRemarks || `Your query status is now ${query.status}.`, type: 'query', relatedType: 'query', relatedId: query._id });
    }

    return NextResponse.json(query, { status: 200 });
  } catch (error) {
    console.error('Query update error:', error);
    return NextResponse.json(
      { message: 'Error updating query' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: 'Invalid query ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const query = await Query.findByIdAndDelete(params.id);
    if (!query) return NextResponse.json({ message: 'Query not found' }, { status: 404 });

    await Promise.all([
      QueryMessage.deleteMany({ queryId: query._id }),
      ServiceNotification.deleteMany({ relatedType: 'query', relatedId: query._id }),
      CitizenNotification.deleteMany({ userId: query.userId, relatedType: 'query', relatedId: query._id }),
    ]);

    return NextResponse.json({ message: `Query ${query.queryId} deleted successfully.` });
  } catch (error) {
    console.error('Query deletion error:', error);
    return NextResponse.json({ message: 'Unable to delete query.' }, { status: 500 });
  }
}
