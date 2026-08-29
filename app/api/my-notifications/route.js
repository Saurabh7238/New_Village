import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import ServiceNotification from '@/models/ServiceNotification';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

const links = {
  application: (id) => `/dashboard/applications?application=${id}`,
  appointment: () => '/appointments',
  query: () => '/track',
};

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  await connectDB();
  const notifications = await ServiceNotification.find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({
    unread: notifications.filter((notification) => !notification.isRead && notification.adminResponded).length,
    notifications: notifications.map((notification) => ({
      id: notification._id.toString(),
      serviceType: notification.serviceType,
      relatedType: notification.relatedType,
      relatedId: notification.relatedId.toString(),
      isRead: notification.isRead,
      adminResponded: notification.adminResponded,
      updatedAt: notification.updatedAt,
      title: `Update for your ${notification.serviceType.replace(/[-:]/g, ' ')}`,
      link: links[notification.relatedType](notification.relatedId.toString()),
    })),
  });
}

export async function PATCH(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  const { id, all } = await request.json().catch(() => ({}));
  await connectDB();
  const filter = { userId: session.user.id, adminResponded: { $ne: null } };
  if (!all) filter._id = id;

  if (!all && !id) return NextResponse.json({ message: 'Notification ID is required.' }, { status: 400 });
  await ServiceNotification.updateMany(filter, { $set: { isRead: true } });
  return NextResponse.json({ success: true });
}
