import NotificationBoard from '@/models/NotificationBoard';
import { notifyNoticeSubscribers } from '@/lib/noticeNotificationService';

export async function syncNotificationLifecycle(now = new Date()) {
  const dueScheduledNotices = await NotificationBoard.find({
    status: 'scheduled',
    scheduledPublishDate: { $ne: null, $lte: now },
    $or: [{ validTill: null }, { validTill: { $gt: now } }],
  }).lean();

  await NotificationBoard.updateMany(
    {
      status: { $in: ['scheduled', 'published'] },
      validTill: { $ne: null, $lte: now },
    },
    { $set: { status: 'archived' } }
  );

  await NotificationBoard.updateMany(
    {
      status: 'scheduled',
      scheduledPublishDate: { $ne: null, $lte: now },
      $or: [{ validTill: null }, { validTill: { $gt: now } }],
    },
    { $set: { status: 'published' } }
  );

  for (const notification of dueScheduledNotices) {
    try {
      await notifyNoticeSubscribers({ ...notification, status: 'published' });
    } catch (error) {
      console.error(`Failed to notify subscribers for scheduled notice ${notification._id}:`, error);
    }
  }
}
