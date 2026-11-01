import CitizenNotification from '@/models/CitizenNotification';
import NoticeSubscription from '@/models/NoticeSubscription';
import NotificationBoard from '@/models/NotificationBoard';
import User from '@/models/User';
import { CATEGORY_LABELS } from '@/lib/notificationConstants';
import { sendTrackedEmail } from '@/lib/trackedEmail';

export async function notifyNoticeSubscribers(notification) {
  if (notification.status !== 'published') {
    return { notified: 0, emailSent: 0, emailFailed: 0 };
  }

  const claimed = await NotificationBoard.findOneAndUpdate(
    { _id: notification._id, status: 'published', subscribersNotifiedAt: null },
    { $set: { subscribersNotifiedAt: new Date() } },
    { new: true },
  ).select('_id').lean();

  if (!claimed) return { notified: 0, emailSent: 0, emailFailed: 0, alreadyNotified: true };

  try {
    const subscriptions = await NoticeSubscription.find({
      categories: notification.category,
      $or: [{ inAppEnabled: true }, { emailEnabled: true }],
    }).lean();
    if (!subscriptions.length) return { notified: 0, emailSent: 0, emailFailed: 0 };

    const users = await User.find({
      _id: { $in: subscriptions.map((subscription) => subscription.userId) },
      status: 'active',
    }).select('name email').lean();
    const usersById = new Map(users.map((user) => [user._id.toString(), user]));
    const subscribers = subscriptions
      .map((subscription) => ({ subscription, user: usersById.get(subscription.userId.toString()) }))
      .filter(({ user }) => user);

    const inAppSubscribers = subscribers.filter(({ subscription }) => subscription.inAppEnabled);
    if (inAppSubscribers.length) {
      await CitizenNotification.bulkWrite(inAppSubscribers.map(({ subscription, user }) => ({
        updateOne: {
          filter: { userId: user._id, relatedType: 'notice', relatedId: notification._id },
          update: {
            $setOnInsert: {
              userId: user._id,
              title: notification.title,
              message: notification.description,
              type: 'message',
              relatedType: 'notice',
              relatedId: notification._id,
            },
          },
          upsert: true,
        },
      })));
    }

    const emailSubscribers = subscribers.filter(({ subscription, user }) =>
      subscription.emailEnabled && user.email
    );
    const categoryLabel = CATEGORY_LABELS[notification.category] || notification.category;
    const emailResults = await Promise.all(emailSubscribers.map(({ user }) =>
      sendTrackedEmail({
        userId: user._id,
        category: 'notice',
        eventKey: `notice:${notification._id}:${user._id}`,
        relatedType: 'notice',
        relatedId: notification._id,
        subject: `Chiutahara notice: ${notification.title}`,
        text: `${notification.title}\n\n${notification.description}\n\nCategory: ${categoryLabel}\nManage subscriptions: ${new URL('/notices', process.env.NEXTAUTH_URL || 'http://localhost:3000')}`,
      })
    ));
    const emailFailed = emailResults.filter((result) => result.status === 'failed').length;
    const emailSent = emailResults.filter((result) => result.status === 'sent').length;
    const emailSkipped = emailResults.filter((result) => result.status === 'skipped').length;
    if (emailFailed) {
      console.error(`Email delivery failed for ${emailFailed} notice subscriber(s).`);
    }

    return {
      notified: inAppSubscribers.length,
      emailSent,
      emailFailed,
      emailSkipped,
      categoryLabel,
    };
  } catch (error) {
    await NotificationBoard.updateOne({ _id: notification._id }, { $set: { subscribersNotifiedAt: null } });
    throw error;
  }
}
