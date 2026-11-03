import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import AuditLog from '@/models/AuditLog';
import Application from '@/models/Application';
import Appointment from '@/models/Appointment';
import Query from '@/models/Query';
import VoterData from '@/models/VoterData';
import CitizenNotification from '@/models/CitizenNotification';
import ServiceNotification from '@/models/ServiceNotification';
import { writeAuditLog } from '@/lib/writeAuditLog';
import { addStatusHistoryEntry } from '@/lib/requestHistory';
import { sendTrackedEmail } from '@/lib/trackedEmail';

const RESTORABLE_ACTIONS = {
  application: 'Application updated',
  appointment: 'Appointment updated',
  query: 'Query updated',
  'voter-data': ['Voter record created', 'Voter record updated', 'Voter records bulk updated', 'Voter record deleted', 'Voter records deleted'],
};
const VOTER_RESTORABLE_FIELDS = [
  'type', 'voterId', 'elector_id', 'electorId', 'voterName', 'electorName',
  'voterGuardianName', 'parent_name', 'parent_name_en', 'parent_name_hi',
  'parentNameEn', 'parentNameHi', 'voterGender', 'gender', 'age', 'voterAge',
  'voterWardNo', 'ward', 'voterConstituency', 'constituency', 'svn_no',
  'serial_number', 'house_no', 'elector_name', 'elector_name_en',
  'elector_name_hi', 'electorNameEn', 'electorNameHi', 'relation_type',
  'relationship', 'name', 'dateOfBirth',
];

function sameSnapshot(current, expected, fields) {
  return fields.every((field) => {
    const currentValue = current[field] instanceof Date
      ? current[field].toISOString()
      : current[field] ?? null;
    const expectedValue = expected[field] instanceof Date
      ? expected[field].toISOString()
      : expected[field] ?? null;
    if (Array.isArray(currentValue) || Array.isArray(expectedValue)) {
      return JSON.stringify(currentValue || []) === JSON.stringify(expectedValue || []);
    }
    return currentValue === expectedValue;
  });
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const { auditId, sendEmail = true } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(auditId)) {
      return NextResponse.json({ message: 'A valid audit entry is required.' }, { status: 400 });
    }
    await connectDB();

    const entry = await AuditLog.findById(auditId).lean();
    const type = entry?.entityType;
    const allowedAction = RESTORABLE_ACTIONS[type];
    const actionAllowed = Array.isArray(allowedAction) ? allowedAction.includes(entry?.action) : entry?.action === allowedAction;
    if (!entry || !allowedAction || !actionAllowed || !Object.hasOwn(entry.details || {}, 'before') || !Object.hasOwn(entry.details || {}, 'after')) {
      return NextResponse.json({ message: 'This audit entry does not contain a restorable change.' }, { status: 400 });
    }

    const id = entry.entityId || entry.details.applicationId || entry.details.appointmentId || entry.details.queryId;
    if (type !== 'voter-data' && !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'The original request record is unavailable.' }, { status: 400 });
    }

    let requestRecord;
    let fields;
    let before;
    let restored;
    if (type === 'voter-data') {
      const beforeRecords = Array.isArray(entry.details.before)
        ? entry.details.before
        : entry.details.before ? [entry.details.before] : [];
      const afterRecords = Array.isArray(entry.details.after)
        ? entry.details.after
        : entry.details.after ? [entry.details.after] : [];
      const auditIds = [...new Set([...beforeRecords, ...afterRecords].map((record) => record?._id).filter(Boolean))];
      if (!auditIds.length || auditIds.length > 500 || auditIds.some((recordId) => !mongoose.Types.ObjectId.isValid(recordId))) {
        return NextResponse.json({ message: 'This voter audit entry cannot be restored.' }, { status: 400 });
      }

      const records = await VoterData.find({ _id: { $in: auditIds } }).lean();
      const currentById = new Map(records.map((record) => [record._id.toString(), record]));
      const beforeById = new Map(beforeRecords.map((record) => [record._id, record]));
      const afterById = new Map(afterRecords.map((record) => [record._id, record]));
      const restoringDeletion = beforeRecords.length > 0 && afterRecords.length === 0;
      const undoingCreation = beforeRecords.length === 0 && afterRecords.length > 0;

      if (restoringDeletion) {
        if (records.length) {
          return NextResponse.json({ message: 'One or more deleted voter records already exist. Refresh the audit log before restoring.' }, { status: 409 });
        }
        await VoterData.insertMany(beforeRecords.map((record) => ({
          _id: record._id,
          ...Object.fromEntries(VOTER_RESTORABLE_FIELDS
            .filter((field) => record[field] !== undefined)
            .map((field) => [field, record[field]])),
        })));
        before = [];
        restored = beforeRecords;
      } else if (undoingCreation) {
        const record = currentById.get(afterRecords[0]._id);
        if (afterRecords.length !== 1 || !record || !sameSnapshot(record, afterRecords[0], VOTER_RESTORABLE_FIELDS)) {
          return NextResponse.json({ message: 'This voter has changed since this audit entry. Refresh the audit log before restoring.' }, { status: 409 });
        }
        await VoterData.deleteOne({ _id: record._id });
        before = afterRecords;
        restored = [];
      } else {
        if (!beforeRecords.length || beforeRecords.length !== afterRecords.length) {
          return NextResponse.json({ message: 'This voter audit entry is incomplete and cannot be restored.' }, { status: 400 });
        }
        for (const [recordId, afterRecord] of afterById) {
          const current = currentById.get(recordId);
          if (!beforeById.has(recordId) || !current || !sameSnapshot(current, afterRecord, VOTER_RESTORABLE_FIELDS)) {
            return NextResponse.json({ message: 'One or more voters have changed since this audit entry. Refresh the audit log before restoring.' }, { status: 409 });
          }
        }
        for (const [recordId, previousRecord] of beforeById) {
          const updates = Object.fromEntries(VOTER_RESTORABLE_FIELDS
            .filter((field) => previousRecord[field] !== undefined)
            .map((field) => [field, previousRecord[field]]));
          await VoterData.updateOne({ _id: recordId }, { $set: updates }, { runValidators: true });
        }
        before = afterRecords;
        restored = beforeRecords;
      }

      await writeAuditLog({
        session,
        action: 'Voter records restored from audit history',
        entityType: 'voter-data',
        entityId: auditIds.length === 1 ? auditIds[0] : null,
        details: { sourceAuditId: entry._id.toString(), before, after: restored },
      });
      return NextResponse.json({ success: true, message: 'Voter records restored and recorded in the activity log.' });
    } else if (type === 'application') {
      fields = ['status', 'adminRemarks', 'requestedDocuments'];
      requestRecord = await Application.findById(id);
      if (!requestRecord) return NextResponse.json({ message: 'Application not found.' }, { status: 404 });
      if (!sameSnapshot(requestRecord, entry.details.after, fields)) {
        return NextResponse.json({ message: 'This application has changed since this audit entry. Refresh the audit log before restoring.' }, { status: 409 });
      }
      before = Object.fromEntries(fields.map((field) => [field, requestRecord[field]]));
      restored = entry.details.before;
      requestRecord.status = restored.status;
      requestRecord.adminRemarks = restored.adminRemarks || '';
      requestRecord.requestedDocuments = restored.requestedDocuments || [];
      requestRecord.reviewedBy = session.user.id;
      requestRecord.statusHistory = addStatusHistoryEntry(requestRecord.statusHistory, {
        status: requestRecord.status,
        remarks: requestRecord.adminRemarks,
        changedBy: session.user.name || 'Admin',
        changedAt: new Date(),
      });
      await requestRecord.save();
    } else if (type === 'appointment') {
      fields = ['status', 'adminRemarks', 'scheduledDate', 'scheduledTime', 'appointmentDate', 'appointmentTime'];
      requestRecord = await Appointment.findOne({ _id: id, archivedAt: null });
      if (!requestRecord) return NextResponse.json({ message: 'Active appointment not found.' }, { status: 404 });
      if (!sameSnapshot(requestRecord, entry.details.after, fields)) {
        return NextResponse.json({ message: 'This appointment has changed since this audit entry. Refresh the audit log before restoring.' }, { status: 409 });
      }
      before = Object.fromEntries(fields.map((field) => [field, requestRecord[field] ?? null]));
      restored = entry.details.before;
      requestRecord.status = restored.status;
      requestRecord.adminRemarks = restored.adminRemarks || '';
      requestRecord.scheduledDate = restored.scheduledDate || null;
      requestRecord.scheduledTime = restored.scheduledTime || '';
      requestRecord.appointmentDate = restored.appointmentDate;
      requestRecord.appointmentTime = restored.appointmentTime;
      requestRecord.reviewedBy = session.user.id;
      requestRecord.statusHistory.push({
        status: requestRecord.status,
        remarks: requestRecord.adminRemarks,
        changedBy: session.user.id,
        changedAt: new Date(),
      });
      await requestRecord.save();
    } else if (type === 'query') {
      fields = ['status', 'adminRemarks', 'priority', 'assignedTo'];
      requestRecord = await Query.findById(id);
      if (!requestRecord) return NextResponse.json({ message: 'Query not found.' }, { status: 404 });
      if (!sameSnapshot(requestRecord, entry.details.after, fields)) {
        return NextResponse.json({ message: 'This query has changed since this audit entry. Refresh the audit log before restoring.' }, { status: 409 });
      }
      before = Object.fromEntries(fields.map((field) => [field, requestRecord[field] ?? null]));
      restored = entry.details.before;
      requestRecord.status = restored.status;
      requestRecord.adminRemarks = restored.adminRemarks || '';
      requestRecord.priority = restored.priority;
      requestRecord.assignedTo = restored.assignedTo || null;
      requestRecord.statusHistory.push({
        status: requestRecord.status,
        remarks: requestRecord.adminRemarks,
        changedBy: session.user.name || 'Admin',
        changedAt: new Date(),
      });
      await requestRecord.save();
    }

    let emailDelivery = { status: 'not-needed' };
    if (requestRecord.userId) {
      await Promise.all([
        ServiceNotification.findOneAndUpdate(
          { relatedType: type, relatedId: requestRecord._id },
          {
            $set: { adminResponded: new Date(), isRead: false },
            $setOnInsert: {
              userId: requestRecord.userId,
              serviceType: requestRecord.serviceType || (type === 'query' ? `query:${requestRecord.category}` : type),
              queryRaised: requestRecord.createdAt || new Date(),
            },
          },
          { upsert: true },
        ),
        CitizenNotification.create({
          userId: requestRecord.userId,
          title: `${type[0].toUpperCase()}${type.slice(1)} update restored`,
          message: 'An administrator restored a previous update to this request. View the request for details.',
          type,
          relatedType: type,
          relatedId: requestRecord._id,
        }),
      ]);
      const emailCategory = type === 'query' ? 'grievance' : type;
      const requestNumber = requestRecord.applicationNumber || requestRecord.appointmentNumber || requestRecord.queryId || requestRecord._id.toString();
      emailDelivery = sendEmail ? await sendTrackedEmail({
        userId: requestRecord.userId,
        category: emailCategory,
        eventKey: `${type}:${requestRecord._id}:restore:${requestRecord.updatedAt.toISOString()}`,
        relatedType: type,
        relatedId: requestRecord._id,
        subject: `${type[0].toUpperCase()}${type.slice(1)} ${requestNumber} restored`,
        text: `An administrator restored a previous update to your ${type} ${requestNumber}. It is now ${requestRecord.status}.${requestRecord.adminRemarks ? `\n\nAdministrator response: ${requestRecord.adminRemarks}` : ''}\n\nSign in to the Chiutahara Portal to view the latest details.`,
      }) : { status: 'disabled' };
    }

    await writeAuditLog({
      session,
      action: `${type[0].toUpperCase()}${type.slice(1)} restored from audit history`,
      entityType: type,
      entityId: requestRecord._id.toString(),
      details: {
        sourceAuditId: entry._id.toString(),
        before,
        after: Object.fromEntries(fields.map((field) => [field, requestRecord[field] ?? null])),
      },
    });

    return NextResponse.json({ success: true, message: 'Previous request state restored and recorded in history.', emailDelivery });
  } catch (error) {
    console.error('Audit restore failed:', error);
    return NextResponse.json({ message: 'Unable to restore this audit entry.' }, { status: 500 });
  }
}
