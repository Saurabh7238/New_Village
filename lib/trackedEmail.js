import dbConnect from '@/lib/dbConnect';
import HomeSettings from '@/models/HomeSettings';
import NoticeSubscription from '@/models/NoticeSubscription';
import NotificationDelivery from '@/models/NotificationDelivery';
import User from '@/models/User';
import { isNoticeEmailConfigured, sendSmtpEmail } from '@/lib/noticeSubscriptionEmail';

const SETTINGS_FIELDS = {
  notice: 'noticeEmailNotificationsEnabled',
  application: 'applicationEmailNotificationsEnabled',
  appointment: 'appointmentEmailNotificationsEnabled',
  grievance: 'grievanceEmailNotificationsEnabled',
};

const PREFERENCE_FIELDS = {
  notice: 'emailEnabled',
  application: 'applicationEmailEnabled',
  appointment: 'appointmentEmailEnabled',
  grievance: 'grievanceEmailEnabled',
};

function maskEmail(email) {
  const [name, domain] = email.split('@');
  return domain ? `${name.slice(0, 1)}***@${domain}` : '';
}

export async function sendTrackedEmail({
  userId,
  category,
  eventKey,
  relatedType,
  relatedId,
  subject,
  text,
}) {
  if (!SETTINGS_FIELDS[category]) {
    throw new Error(`Unsupported email notification category: ${category}`);
  }

  await dbConnect();
  const [user, preference, settings] = await Promise.all([
    User.findById(userId).select('email status').lean(),
    NoticeSubscription.findOne({ userId }).lean(),
    HomeSettings.findOne({ name: 'default' }).select(Object.values(SETTINGS_FIELDS).join(' ')).lean(),
  ]);
  const emailField = PREFERENCE_FIELDS[category];
  const deliveryFields = {
    userId,
    category,
    eventKey,
    relatedType,
    relatedId,
    subject: String(subject).slice(0, 200),
    text: String(text).slice(0, 4000),
    recipientEmailMasked: user?.email ? maskEmail(user.email) : '',
  };

  const existing = await NotificationDelivery.findOne({ eventKey }).select('status').lean();
  if (existing?.status === 'sent') return { status: 'sent', alreadySent: true };
  if (existing?.status === 'sending') return { status: 'sending', alreadySending: true };

  const skipReason = !user || user.status === 'inactive' || user.status === 'suspended'
    ? 'Citizen account is unavailable.'
    : !user.email
      ? 'Citizen account has no email address.'
      : preference?.[emailField] !== true
        ? 'Citizen has not enabled this email preference.'
        : settings?.[SETTINGS_FIELDS[category]] === false
          ? 'Email notifications are disabled by the administrator.'
          : null;

  if (skipReason) {
    await NotificationDelivery.findOneAndUpdate(
      { eventKey },
      { $setOnInsert: deliveryFields, $set: { status: 'skipped', lastError: skipReason } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { status: 'skipped', reason: skipReason };
  }

  if (!isNoticeEmailConfigured()) {
    const error = 'SMTP email settings are not configured.';
    await NotificationDelivery.findOneAndUpdate(
      { eventKey },
      { $setOnInsert: deliveryFields, $set: { status: 'failed', lastError: error } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { status: 'failed', error };
  }

  let claimed = await NotificationDelivery.findOneAndUpdate(
    { eventKey, status: { $in: ['failed', 'skipped'] } },
    {
      $set: { ...deliveryFields, status: 'sending', lastError: '' },
      $inc: { attempts: 1 },
    },
    { new: true },
  );
  if (!claimed && !existing) {
    try {
      claimed = await NotificationDelivery.create({
        ...deliveryFields,
        status: 'sending',
        attempts: 1,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  if (!claimed) return { status: 'sending', alreadySending: true };

  try {
    await sendSmtpEmail({ to: user.email, subject, text });
    await NotificationDelivery.updateOne(
      { _id: claimed._id },
      { $set: { status: 'sent', sentAt: new Date(), lastError: '' } },
    );
    return { status: 'sent' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed.';
    await NotificationDelivery.updateOne(
      { _id: claimed._id },
      { $set: { status: 'failed', lastError: message } },
    );
    console.error(`Email delivery failed for ${category} notification:`, message);
    return { status: 'failed', error: message };
  }
}
