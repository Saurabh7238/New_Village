import CitizenNotification from '@/models/CitizenNotification';
import NoticeSubscription from '@/models/NoticeSubscription';
import NotificationBoard from '@/models/NotificationBoard';
import User from '@/models/User';
import { CATEGORY_LABELS } from '@/lib/notificationConstants';
import { isNoticeEmailConfigured, sendNoticeSubscriptionEmail } from '@/lib/noticeSubscriptionEmail';

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
    if (emailSubscribers.length && !isNoticeEmailConfigured()) {
      console.error('Notice email delivery is unavailable because SMTP is not configured.');
      return {
        notified: inAppSubscribers.length,
        emailSent: 0,
        emailFailed: emailSubscribers.length,
        emailConfigured: false,
      };
    }

    const emailResults = await Promise.allSettled(emailSubscribers.map(({ user }) =>
      sendNoticeSubscriptionEmail(user.email, {
        id: notification._id.toString(),
        title: notification.title,
        description: notification.description,
      })
    ));
    const emailFailed = emailResults.filter((result) => result.status === 'rejected').length;
    if (emailFailed) {
      console.error(`Email delivery failed for ${emailFailed} notice subscriber(s).`);
    }

    return {
      notified: inAppSubscribers.length,
      emailSent: emailResults.length - emailFailed,
      emailFailed,
      emailConfigured: isNoticeEmailConfigured(),
      categoryLabel: CATEGORY_LABELS[notification.category] || notification.category,
    };
  } catch (error) {
    await NotificationBoard.updateOne({ _id: notification._id }, { $set: { subscribersNotifiedAt: null } });
    throw error;
  }
}
