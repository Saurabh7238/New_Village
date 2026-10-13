import NotificationBoard from '@/models/NotificationBoard';

export async function syncNotificationLifecycle(now = new Date()) {
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
}
