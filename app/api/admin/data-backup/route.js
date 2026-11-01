import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';
import Application from '@/models/Application';
import Appointment from '@/models/Appointment';
import NotificationBoard from '@/models/NotificationBoard';
import Query from '@/models/Query';
import User from '@/models/User';

const MAX_RECORDS_PER_COLLECTION = 5000;
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const SUPPORTED_COLLECTIONS = new Set(['applications', 'appointments', 'grievances', 'notices']);
const COLLECTIONS = {
  applications: {
    model: Application,
    select: '_id applicationNumber userId serviceType status formData requestedDocuments adminRemarks reviewedBy createdAt updatedAt',
    key: 'applicationNumber',
  },
  appointments: {
    model: Appointment,
    select: '_id appointmentNumber userId service appointmentDate appointmentTime scheduledDate scheduledTime purpose status adminRemarks archivedAt archivedBy reviewedBy statusHistory createdAt updatedAt',
    key: 'appointmentNumber',
  },
  grievances: {
    model: Query,
    select: '_id queryId userId name mobile ward village category subject description address status priority assignedTo adminRemarks escalate acknowledgedAt resolvedAt createdAt updatedAt',
    key: 'queryId',
  },
  notices: {
    model: NotificationBoard,
    select: '_id type level title description issueDate validTill priority status createdBy category scheduledPublishDate subscribersNotifiedAt viewCount createdAt updatedAt',
    key: '_id',
  },
};

function isValidId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function cleanApplication(record) {
  return {
    _id: record._id,
    applicationNumber: record.applicationNumber,
    userId: record.userId,
    serviceType: record.serviceType,
    status: record.status,
    formData: record.formData || {},
    requestedDocuments: Array.isArray(record.requestedDocuments) ? record.requestedDocuments : [],
    adminRemarks: record.adminRemarks || '',
    reviewedBy: record.reviewedBy || null,
    ...(record.createdAt && { createdAt: record.createdAt }),
    ...(record.updatedAt && { updatedAt: record.updatedAt }),
  };
}

function cleanAppointment(record) {
  return {
    _id: record._id,
    appointmentNumber: record.appointmentNumber,
    userId: record.userId,
    service: record.service,
    appointmentDate: record.appointmentDate,
    appointmentTime: record.appointmentTime,
    scheduledDate: record.scheduledDate || null,
    scheduledTime: record.scheduledTime || '',
    purpose: record.purpose,
    status: record.status,
    adminRemarks: record.adminRemarks || '',
    archivedAt: record.archivedAt || null,
    archivedBy: record.archivedBy || null,
    reviewedBy: record.reviewedBy || null,
    statusHistory: Array.isArray(record.statusHistory) ? record.statusHistory : [],
    ...(record.createdAt && { createdAt: record.createdAt }),
    ...(record.updatedAt && { updatedAt: record.updatedAt }),
  };
}

function cleanGrievance(record) {
  return {
    _id: record._id,
    queryId: record.queryId,
    userId: record.userId || null,
    name: record.name,
    mobile: record.mobile,
    ward: record.ward,
    village: record.village || '',
    category: record.category,
    subject: record.subject,
    description: record.description,
    address: record.address || '',
    status: record.status,
    priority: record.priority,
    assignedTo: record.assignedTo || null,
    adminRemarks: record.adminRemarks || '',
    escalate: record.escalate === true,
    acknowledgedAt: record.acknowledgedAt || null,
    resolvedAt: record.resolvedAt || null,
    ...(record.createdAt && { createdAt: record.createdAt }),
    ...(record.updatedAt && { updatedAt: record.updatedAt }),
  };
}

function cleanNotice(record) {
  return {
    _id: record._id,
    type: record.type,
    level: record.level,
    title: record.title,
    description: record.description,
    issueDate: record.issueDate,
    validTill: record.validTill || null,
    priority: record.priority,
    status: record.status,
    createdBy: record.createdBy,
    category: record.category,
    scheduledPublishDate: record.scheduledPublishDate || null,
    subscribersNotifiedAt: record.subscribersNotifiedAt || null,
    viewCount: record.viewCount || 0,
    ...(record.createdAt && { createdAt: record.createdAt }),
    ...(record.updatedAt && { updatedAt: record.updatedAt }),
  };
}

const CLEANERS = {
  applications: cleanApplication,
  appointments: cleanAppointment,
  grievances: cleanGrievance,
  notices: cleanNotice,
};

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    await dbConnect();
    const requested = new URL(request.url).searchParams.get('collections')?.split(',') || [];
    const selected = [...new Set(requested)].filter((name) => SUPPORTED_COLLECTIONS.has(name));
    if (!selected.length) {
      return NextResponse.json({ message: 'Select at least one supported collection.' }, { status: 400 });
    }

    const collections = {};
    for (const name of selected) {
      const { model, select } = COLLECTIONS[name];
      const count = await model.countDocuments({});
      if (count > MAX_RECORDS_PER_COLLECTION) {
        return NextResponse.json({
          message: `${name} contains more than ${MAX_RECORDS_PER_COLLECTION} records. Narrow the export before downloading.`,
        }, { status: 413 });
      }
      const records = await model.find({}).select(select).sort({ createdAt: 1 }).lean();
      collections[name] = records.map(CLEANERS[name]);
    }

    const backupJson = JSON.stringify({
      format: 'chiutahara-operational-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      collections,
    });
    if (Buffer.byteLength(backupJson, 'utf8') > MAX_IMPORT_BYTES) {
      return NextResponse.json({ message: 'Selected records exceed the 10 MB backup size limit. Select fewer collections.' }, { status: 413 });
    }

    await writeAuditLog({
      session,
      action: 'Operational data backup downloaded',
      entityType: 'data-backup',
      details: { collections: selected, recordCounts: Object.fromEntries(selected.map((name) => [name, collections[name].length])) },
    });

    return new Response(backupJson, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="chiutahara-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Operational backup export failed:', error);
    return NextResponse.json({ message: 'Unable to export operational data.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_IMPORT_BYTES) {
      return NextResponse.json({ message: 'Backup file exceeds the 10 MB import limit.' }, { status: 413 });
    }
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ message: 'Backup file body is missing.' }, { status: 400 });
    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMPORT_BYTES) {
        await reader.cancel();
        return NextResponse.json({ message: 'Backup file exceeds the 10 MB import limit.' }, { status: 413 });
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    let backup;
    try {
      backup = JSON.parse(body);
    } catch {
      return NextResponse.json({ message: 'Backup file must contain valid JSON.' }, { status: 400 });
    }
    if (Buffer.byteLength(body, 'utf8') > MAX_IMPORT_BYTES) {
      return NextResponse.json({ message: 'Backup file exceeds the 10 MB import limit.' }, { status: 413 });
    }
    if (backup?.format !== 'chiutahara-operational-backup' || backup.version !== 1 || !backup.collections || typeof backup.collections !== 'object') {
      return NextResponse.json({ message: 'This is not a supported Chiutahara operational backup.' }, { status: 400 });
    }

    const selected = Object.keys(backup.collections);
    if (!selected.length || selected.some((name) => !SUPPORTED_COLLECTIONS.has(name))) {
      return NextResponse.json({ message: 'Backup contains an unsupported collection.' }, { status: 400 });
    }
    if (selected.some((name) => !Array.isArray(backup.collections[name]) || backup.collections[name].length > MAX_RECORDS_PER_COLLECTION)) {
      return NextResponse.json({ message: 'Backup has an invalid or oversized collection.' }, { status: 400 });
    }

    await dbConnect();
    const userIds = new Set();
    for (const name of ['applications', 'appointments', 'grievances']) {
      for (const record of backup.collections[name] || []) {
        if (record.userId && isValidId(record.userId)) userIds.add(String(record.userId));
        if (record.reviewedBy && isValidId(record.reviewedBy)) userIds.add(String(record.reviewedBy));
        if (record.archivedBy && isValidId(record.archivedBy)) userIds.add(String(record.archivedBy));
      }
    }
    const existingUsers = await User.find({ _id: { $in: [...userIds] } }).select('_id').lean();
    const existingUserIds = new Set(existingUsers.map((user) => user._id.toString()));
    const results = {};

    for (const name of selected) {
      const { model, key } = COLLECTIONS[name];
      const inserted = [];
      let skipped = 0;
      for (const rawRecord of backup.collections[name]) {
        if (!rawRecord || typeof rawRecord !== 'object' || !rawRecord[key] || !isValidId(rawRecord._id)) {
          skipped += 1;
          continue;
        }
        const record = CLEANERS[name](rawRecord);
        const referencedUserIds = [record.userId, record.reviewedBy, record.archivedBy].filter(Boolean).map(String);
        if (referencedUserIds.some((id) => !existingUserIds.has(id))) {
          skipped += 1;
          continue;
        }

        const existing = await model.findOne({
          $or: [
            { [key]: record[key] },
            { _id: record._id },
          ],
        }).select('_id').lean();
        if (existing) {
          skipped += 1;
          continue;
        }
        inserted.push(record);
      }

      let restored = 0;
      for (const record of inserted) {
        try {
          await model.create(record);
          restored += 1;
        } catch (error) {
          if (error?.code === 11000 || error?.name === 'ValidationError' || error?.name === 'CastError') {
            skipped += 1;
            continue;
          }
          throw error;
        }
      }
      results[name] = { restored, skipped };
    }

    await writeAuditLog({
      session,
      action: 'Operational data backup restored',
      entityType: 'data-backup',
      details: { results },
    });
    return NextResponse.json({
      message: 'Backup merge completed. Existing records were left unchanged.',
      results,
    });
  } catch (error) {
    console.error('Operational backup restore failed:', error);
    return NextResponse.json({ message: 'Unable to restore the backup.' }, { status: 500 });
  }
}
