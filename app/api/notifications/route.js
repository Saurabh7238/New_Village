import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import NotificationBoard from '@/models/NotificationBoard';
import NotificationDocument from '@/models/NotificationDocument';
import mongoose from 'mongoose';

async function getSession() {
  return await getServerSession();
}

// --- GET (FETCH ALL NOTIFICATIONS) ---
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const session = await getSession();
    const type = searchParams.get('type');
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Build filter
    const filter = {};

    // Public users see only published, non-expired notifications (including scheduled ones that are due)
    if (!session?.user?.role === 'admin') {
      filter.$or = [
        { status: 'published' },
        { status: 'published', scheduledPublishDate: { $lte: new Date() } },
      ];
      filter.$and = [
        {
          $or: [
            { validTill: { $exists: false } },
            { validTill: { $gt: new Date() } },
          ],
        },
      ];
    }

    if (type) filter.type = type;
    if (level) filter.level = level;
    if (category) filter.category = category;
    if (status) filter.status = status;

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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate documents for each notification
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
      { status: 200 }
    );
  } catch (error) {
    console.error('GET Notifications Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// --- POST (CREATE NOTIFICATION) ---
export async function POST(request) {
  try {
    const session = await getSession();

    // Admin only
    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { type, level, title, description, issueDate, validTill, priority, status, category, scheduledPublishDate } = body;

    // Validation
    if (!type || !level || !title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: 'Type, level, title, and description are required',
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Title cannot exceed 200 characters' },
        { status: 400 }
      );
    }

    if (validTill && issueDate && new Date(validTill) < new Date(issueDate)) {
      return NextResponse.json(
        { success: false, message: 'Valid Till date must be after Issue Date' },
        { status: 400 }
      );
    }

    if (scheduledPublishDate && new Date(scheduledPublishDate) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Scheduled Publish Date must be in the future' },
        { status: 400 }
      );
    }

    const newNotification = await NotificationBoard.create({
      type,
      level,
      title,
      description,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      validTill: validTill ? new Date(validTill) : null,
      priority: priority || 'medium',
      status: status || 'draft',
      category: category || 'announcement',
      scheduledPublishDate: scheduledPublishDate ? new Date(scheduledPublishDate) : null,
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
      { success: false, message: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// --- PUT (UPDATE NOTIFICATION) ---
export async function PUT(request) {
  try {
    const session = await getSession();

    // Admin only
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

    // Validation
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

    if (validTill && issueDate && new Date(validTill) < new Date(issueDate)) {
      return NextResponse.json(
        { success: false, message: 'Valid Till date must be after Issue Date' },
        { status: 400 }
      );
    }

    if (scheduledPublishDate && new Date(scheduledPublishDate) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Scheduled Publish Date must be in the future' },
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
        status,
        category,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        validTill: validTill ? new Date(validTill) : null,
        scheduledPublishDate: scheduledPublishDate ? new Date(scheduledPublishDate) : null,
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
      { success: false, message: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// --- DELETE (DELETE NOTIFICATION) ---
export async function DELETE(request) {
  try {
    const session = await getSession();

    // Admin only
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

    // Delete notification and all associated documents
    const deletedNotification = await NotificationBoard.findByIdAndDelete(id);

    if (!deletedNotification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete all documents
    await NotificationDocument.deleteMany({ notificationId: id });

    return NextResponse.json(
      { success: true, message: 'Notification deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE Notification Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
