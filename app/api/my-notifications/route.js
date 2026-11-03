import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import ServiceNotification from '@/models/ServiceNotification';
import CitizenNotification from '@/models/CitizenNotification';
import NotificationDelivery from '@/models/NotificationDelivery';
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
  const [serviceNotifications, noticeNotifications] = await Promise.all([
    ServiceNotification.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .limit(100)
      .select('serviceType relatedType relatedId isRead adminResponded updatedAt')
      .lean(),
    CitizenNotification.find({ userId: session.user.id, relatedType: 'notice' })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('title message relatedId isRead createdAt updatedAt')
      .lean(),
  ]);
  const serviceIds = serviceNotifications.map(({ relatedId }) => relatedId);
  const deliveries = serviceIds.length
    ? await NotificationDelivery.find({
      userId: session.user.id,
      relatedType: { $in: ['application', 'appointment', 'query'] },
      relatedId: { $in: serviceIds },
    }).sort({ updatedAt: -1 }).select('relatedType relatedId status sentAt updatedAt').lean()
    : [];
  const deliveryByRequest = new Map();
  for (const delivery of deliveries) {
    const key = `${delivery.relatedType}:${delivery.relatedId}`;
    if (!deliveryByRequest.has(key)) {
      deliveryByRequest.set(key, {
        status: delivery.status,
        sentAt: delivery.sentAt,
        updatedAt: delivery.updatedAt,
      });
    }
  }
  const notifications = [
    ...serviceNotifications.map((notification) => ({
      id: notification._id.toString(),
      serviceType: notification.serviceType,
      relatedType: notification.relatedType,
      relatedId: notification.relatedId.toString(),
      isRead: notification.isRead,
      adminResponded: notification.adminResponded,
      updatedAt: notification.updatedAt,
      emailDelivery: deliveryByRequest.get(`${notification.relatedType}:${notification.relatedId}`) || null,
      title: `Update for your ${notification.serviceType.replace(/[-:]/g, ' ')}`,
      link: links[notification.relatedType](notification.relatedId.toString()),
    })),
    ...noticeNotifications.map((notification) => ({
      id: notification._id.toString(),
      serviceType: 'Community notice',
      relatedType: 'notice',
      relatedId: notification.relatedId.toString(),
      isRead: notification.isRead,
      adminResponded: notification.createdAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      title: notification.title,
      message: notification.message,
      link: `/notifications/${notification.relatedId}`,
    })),
  ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 100);

  return NextResponse.json({
    unread: notifications.filter((notification) =>
      !notification.isRead && (notification.relatedType === 'notice' || notification.adminResponded)
    ).length,
    notifications,
  });
}

export async function PATCH(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  const { id, all } = await request.json().catch(() => ({}));
  await connectDB();
  if (!all && !id) return NextResponse.json({ message: 'Notification ID is required.' }, { status: 400 });
  if (all) {
    await Promise.all([
      ServiceNotification.updateMany(
        { userId: session.user.id, adminResponded: { $ne: null } },
        { $set: { isRead: true } },
      ),
      CitizenNotification.updateMany(
        { userId: session.user.id, relatedType: 'notice' },
        { $set: { isRead: true } },
      ),
    ]);
  } else {
    await Promise.all([
      ServiceNotification.updateOne(
        { _id: id, userId: session.user.id, adminResponded: { $ne: null } },
        { $set: { isRead: true } },
      ),
      CitizenNotification.updateOne(
        { _id: id, userId: session.user.id, relatedType: 'notice' },
        { $set: { isRead: true } },
      ),
    ]);
  }
  return NextResponse.json({ success: true });
}
