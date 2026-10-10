import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import NotificationBoard from '@/models/NotificationBoard';
import NotificationDocument from '@/models/NotificationDocument';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid notification ID.' }, { status: 400 });

    await dbConnect();
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    const isAdmin = session?.user?.role === 'admin';
    const visibilityFilter = isAdmin ? { _id: id } : { _id: id, status: 'published' };
    let notification;

    if (viewerId && !isAdmin && mongoose.Types.ObjectId.isValid(viewerId)) {
      notification = await NotificationBoard.findOneAndUpdate(
        { _id: id, status: 'published', viewedBy: { $ne: viewerId } },
        { $addToSet: { viewedBy: viewerId }, $inc: { viewCount: 1 } },
        { new: true, projection: { viewedBy: 0 } },
      ).lean();
    }

    if (!notification) {
      notification = await NotificationBoard.findOne(visibilityFilter).select('-viewedBy').lean();
    }

    if (!notification) return NextResponse.json({ success: false, message: 'Notification not found.' }, { status: 404 });

    const documents = await NotificationDocument.find({ notificationId: id }).lean();
    return NextResponse.json({
      success: true,
      notification: {
        ...notification,
        id: notification._id.toString(),
        documents: documents.map((document) => ({ ...document, id: document._id.toString(), notificationId: document.notificationId.toString() })),
      },
    });
  } catch (error) {
    console.error('Notification detail error:', error);
    return NextResponse.json({ success: false, message: 'Unable to load notification.' }, { status: 500 });
  }
}
