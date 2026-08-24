import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CitizenNotification from '@/models/CitizenNotification';
import AdminNotification from '@/models/AdminNotification';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

function notificationModel(role) {
  return role === 'admin' ? AdminNotification : CitizenNotification;
}

export async function GET() {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  await connectDB();
  const Model = notificationModel(session.user.role);
  const filter = { userId: session.user.id };
  if (session.user.role !== 'admin') filter.type = 'application';

  const [notifications, unread] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).limit(5).lean(),
    Model.countDocuments({ ...filter, isRead: false }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      ...notification,
      id: notification._id.toString(),
      link: session.user.role === 'admin' ? '/admin/applications' : '/dashboard/applications',
    })),
    unread,
  });
}

export async function PATCH(request) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  const { id } = await request.json();
  await connectDB();
  const Model = notificationModel(session.user.role);
  const filter = { userId: session.user.id };
  if (session.user.role !== 'admin') filter.type = 'application';

  if (id) await Model.updateOne({ ...filter, _id: id }, { isRead: true });
  else await Model.updateMany({ ...filter, isRead: false }, { isRead: true });
  return NextResponse.json({ success: true });
}
