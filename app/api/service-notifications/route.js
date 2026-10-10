import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import ServiceNotification from '@/models/ServiceNotification';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

const links = {
  application: (id, admin) => admin ? `/admin/applications?application=${id}` : `/dashboard/applications?application=${id}`,
  appointment: (id, admin) => admin ? '/admin/appointments' : '/appointments',
  query: (id, admin) => admin ? `/admin/queries/${id}` : '/track',
};

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  await connectDB();
  const isAdmin = session.user.role === 'admin';
  const filter = isAdmin
    // The admin bell is only for new citizen submissions. An admin's own
    // reply/update must never reappear as a notification-bell item.
    ? { adminIsRead: false, adminResponded: null }
    : { userId: session.user.id, adminResponded: { $ne: null } };
  const notifications = await ServiceNotification.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
  const unreadNotifications = notifications.filter((notification) => notification.isRead !== true);
  const byService = unreadNotifications.reduce((counts, notification) => {
    counts[notification.serviceType] = (counts[notification.serviceType] || 0) + 1;
    return counts;
  }, {});
  const byRelatedType = unreadNotifications.reduce((counts, notification) => {
    counts[notification.relatedType] = (counts[notification.relatedType] || 0) + 1;
    return counts;
  }, {});
  return NextResponse.json({
    unread: unreadNotifications.length,
    byService,
    byRelatedType,
    notifications: notifications.map((notification) => ({
      ...notification,
      id: notification._id.toString(),
      relatedId: notification.relatedId.toString(),
      link: links[notification.relatedType](notification.relatedId.toString(), isAdmin),
      title: isAdmin ? `New ${notification.serviceType.replace(/[-:]/g, ' ')} request` : `Update for your ${notification.serviceType.replace(/-/g, ' ')}`,
      isRead: notification.isRead === true,
    })),
  });
}

export async function PATCH(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const { id, relatedId, relatedType } = await request.json();
  await connectDB();
  const isAdmin = session.user.role === 'admin';
  const filter = id ? { _id: id } : relatedId ? { relatedId, relatedType } : { relatedType };
  if (!id && !relatedType) return NextResponse.json({ message: 'Notification target is required.' }, { status: 400 });
  if (!isAdmin && !id && !relatedId) return NextResponse.json({ message: 'Notification target is required.' }, { status: 400 });
  if (isAdmin) {
    await ServiceNotification.updateMany(filter, { adminIsRead: true, adminAcknowledgedAt: new Date() });
  } else {
    // The user id and an admin response are both required; clients cannot clear another citizen's badge.
    await ServiceNotification.updateMany({ ...filter, userId: session.user.id, adminResponded: { $ne: null } }, { isRead: true });
  }
  return NextResponse.json({ success: true });
}
