import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import NotificationBoard from '@/models/NotificationBoard';
import NotificationDocument from '@/models/NotificationDocument';
import mongoose from 'mongoose';
import { authOptions } from '../auth/[...nextauth]/route';
import { syncNotificationLifecycle } from '@/lib/notificationLifecycle';

async function getSession() {
  return await getServerSession(authOptions);
}

function getNotificationStatus(status, scheduledPublishDate, now = new Date()) {
  if (status === 'published' && scheduledPublishDate > now) return 'scheduled';
  if (status === 'scheduled' && scheduledPublishDate <= now) return 'published';
  return status || 'draft';
}

// --- GET (FETCH ALL NOTIFICATIONS) ---
export async function GET(request) {
  try {
    await dbConnect();
    const now = new Date();
    await syncNotificationLifecycle(now);
    const { searchParams } = new URL(request.url);

    // Public notification reads must not fail when no auth session exists.
    let session = null;
    try {
      session = await getSession();
    } catch (error) {
      console.warn('Notification session lookup skipped:', error?.message || error);
    }
    const type = searchParams.get('type');
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    const isAdmin = session?.user?.role === 'admin';
    const filter = {};

    if (!isAdmin) {
      // Public users only see published and not-expired notifications
      filter.status = 'published';

      // scheduledPublishDate: must be null or in the past
      filter.$or = [
        { scheduledPublishDate: null },
        { scheduledPublishDate: { $lte: now } },
      ];

      // validTill: must be null or in the future
      filter.$and = [
        {
          $or: [
            { validTill: null },
            { validTill: { $gt: now } },
          ],
        },
      ];
    }

    // Apply additional filters
    if (type) filter.type = type;
    if (level) filter.level = level;
    if (category) filter.category = category;
    if (status && isAdmin) filter.status = status;

    if (search) {
      filter.$text = { $search: search };
    }

    if (dateFrom || dateTo) {
      filter.issueDate = {};
      if (dateFrom) filter.issueDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.issueDate.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const notifications = await NotificationBoard.find(filter)
      .select('-viewedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate documents
    const notificationsWithDocs = await Promise.all(
      notifications.map(async (notif) => {
        const documents = await NotificationDocument.find({
          notificationId: notif._id,
        }).lean();
        return {
          ...notif,
          id: notif._id.toString(),
          documents: documents.map((doc) => ({
            ...doc,
            id: doc._id.toString(),
            notificationId: doc.notificationId.toString(),
          })),
        };
      })
    );

    const total = await NotificationBoard.countDocuments(filter);

    return NextResponse.json(
      {
        success: true,
        notifications: notificationsWithDocs,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.warn('GET Notifications skipped: MongoDB unavailable.', error?.message || error);
    return NextResponse.json(
      {
        success: true,
        notifications: [],
        total: 0,
        page: 1,
        pages: 0,
      },
      { status: 200 }
    );
  }
}

// --- POST (CREATE NOTIFICATION) ---
export async function POST(request) {
  try {
    const session = await getSession();

    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { type, level, title, description, issueDate, validTill, priority, status, category, scheduledPublishDate } = body;
    const issueDateValue = issueDate ? new Date(issueDate) : new Date();
    const validTillValue = validTill ? new Date(validTill) : null;
    const scheduledPublishDateValue = scheduledPublishDate ? new Date(scheduledPublishDate) : null;

    if (
      Number.isNaN(issueDateValue.getTime()) ||
      (validTillValue && Number.isNaN(validTillValue.getTime())) ||
      (scheduledPublishDateValue && Number.isNaN(scheduledPublishDateValue.getTime()))
    ) {
      return NextResponse.json(
        { success: false, message: 'Please provide valid notification dates.' },
        { status: 400 }
      );
    }

    if (!type || !level || !title || !description) {
      return NextResponse.json(
        { success: false, message: 'Type, level, title, and description are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Title cannot exceed 200 characters' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (validTillValue && validTillValue < issueDateValue) {
      return NextResponse.json(
        { success: false, message: 'Valid Till date must be after Issue Date' },
        { status: 400 }
      );
    }

    if (scheduledPublishDateValue && scheduledPublishDateValue < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Scheduled Publish Date must be in the future' },
        { status: 400 }
      );
    }
    if (status === 'scheduled' && !scheduledPublishDateValue) {
      return NextResponse.json(
        { success: false, message: 'A publish date is required for scheduled notifications.' },
        { status: 400 }
      );
    }

    const newNotification = await NotificationBoard.create({
      type,
      level,
      title,
      description,
      issueDate: issueDateValue,
      validTill: validTillValue,
      priority: priority || 'medium',
      status: getNotificationStatus(status, scheduledPublishDateValue),
      category: category || 'announcement',
      scheduledPublishDate: scheduledPublishDateValue,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Notification created successfully',
        notification: {
          ...newNotification.toObject(),
          id: newNotification._id.toString(),
          documents: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Notification Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create notification', error: error.message },
      { status: 500 }
    );
  }
}

// --- PUT (UPDATE NOTIFICATION) ---
export async function PUT(request) {
  try {
    const session = await getSession();

    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Valid notification ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, level, priority, status, issueDate, validTill, category, scheduledPublishDate } = body;
    const issueDateValue = issueDate ? new Date(issueDate) : undefined;
    const validTillValue = validTill ? new Date(validTill) : null;
    const scheduledPublishDateValue = scheduledPublishDate ? new Date(scheduledPublishDate) : null;

    if (
      (issueDateValue && Number.isNaN(issueDateValue.getTime())) ||
      (validTillValue && Number.isNaN(validTillValue.getTime())) ||
      (scheduledPublishDateValue && Number.isNaN(scheduledPublishDateValue.getTime()))
    ) {
      return NextResponse.json(
        { success: false, message: 'Please provide valid notification dates.' },
        { status: 400 }
      );
    }

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Title cannot exceed 200 characters' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (validTillValue && issueDateValue && validTillValue < issueDateValue) {
      return NextResponse.json(
        { success: false, message: 'Valid Till date must be after Issue Date' },
        { status: 400 }
      );
    }

    if (scheduledPublishDateValue && scheduledPublishDateValue < new Date()) {
      const existingNotification = await NotificationBoard.findById(id).select('scheduledPublishDate').lean();
      const unchangedSchedule = existingNotification?.scheduledPublishDate
        && new Date(existingNotification.scheduledPublishDate).getTime() === scheduledPublishDateValue.getTime();
      if (!unchangedSchedule) {
        return NextResponse.json(
          { success: false, message: 'Scheduled Publish Date must be in the future' },
          { status: 400 }
        );
      }
    }
    if (status === 'scheduled' && !scheduledPublishDateValue) {
      return NextResponse.json(
        { success: false, message: 'A publish date is required for scheduled notifications.' },
        { status: 400 }
      );
    }

    const updatedNotification = await NotificationBoard.findByIdAndUpdate(
      id,
      {
        title,
        description,
        level,
        priority,
        category,
        issueDate: issueDateValue,
        validTill: validTillValue,
        status: getNotificationStatus(status, scheduledPublishDateValue),
        scheduledPublishDate: scheduledPublishDateValue,
      },
      { new: true, runValidators: true }
    );

    if (!updatedNotification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    const documents = await NotificationDocument.find({
      notificationId: id,
    }).lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Notification updated successfully',
        notification: {
          ...updatedNotification.toObject(),
          id: updatedNotification._id.toString(),
          documents: documents.map((doc) => ({
            ...doc,
            id: doc._id.toString(),
            notificationId: doc.notificationId.toString(),
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT Notification Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update notification', error: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE (DELETE NOTIFICATION) ---
export async function DELETE(request) {
  try {
    const session = await getSession();

    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Valid notification ID is required' },
        { status: 400 }
      );
    }

    const deletedNotification = await NotificationBoard.findByIdAndDelete(id);

    if (!deletedNotification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    await NotificationDocument.deleteMany({ notificationId: id });

    return NextResponse.json(
      { success: true, message: 'Notification deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE Notification Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete notification', error: error.message },
      { status: 500 }
    );
  }
}
