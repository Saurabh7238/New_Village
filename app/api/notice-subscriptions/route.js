import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';
import User from '@/models/User';
import NoticeSubscription from '@/models/NoticeSubscription';
import { SUBSCRIBABLE_NOTICE_CATEGORIES } from '@/lib/notificationConstants';
import { isNoticeEmailConfigured } from '@/lib/noticeSubscriptionEmail';

export async function GET() {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Please sign in to manage notice subscriptions.' }, { status: 401 });
    }

    await dbConnect();
    const [user, subscription] = await Promise.all([
      User.findById(session.user.id).select('email').lean(),
      NoticeSubscription.findOne({ userId: session.user.id }).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: user.email || '',
      emailConfigured: isNoticeEmailConfigured(),
      subscription: subscription
        ? {
            categories: subscription.categories,
            inAppEnabled: subscription.inAppEnabled,
            emailEnabled: subscription.emailEnabled,
            applicationEmailEnabled: subscription.applicationEmailEnabled === true,
            appointmentEmailEnabled: subscription.appointmentEmailEnabled === true,
            grievanceEmailEnabled: subscription.grievanceEmailEnabled === true,
          }
        : {
            categories: [],
            inAppEnabled: true,
            emailEnabled: false,
            applicationEmailEnabled: false,
            appointmentEmailEnabled: false,
            grievanceEmailEnabled: false,
          },
    });
  } catch (error) {
    console.error('Failed to load notice subscription:', error);
    return NextResponse.json({ success: false, message: 'Unable to load subscription settings.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Please sign in to manage notice subscriptions.' }, { status: 401 });
    }

    const body = await request.json();
    const categories = [...new Set(
      (Array.isArray(body.categories) ? body.categories : [])
        .filter((category) => SUBSCRIBABLE_NOTICE_CATEGORIES.includes(category))
    )];
    const inAppEnabled = body.inAppEnabled === true;
    const emailEnabled = body.emailEnabled === true;
    const applicationEmailEnabled = body.applicationEmailEnabled === true;
    const appointmentEmailEnabled = body.appointmentEmailEnabled === true;
    const grievanceEmailEnabled = body.grievanceEmailEnabled === true;
    const hasServiceEmailPreference = applicationEmailEnabled || appointmentEmailEnabled || grievanceEmailEnabled;

    if (categories.length === 0 && !hasServiceEmailPreference) {
      return NextResponse.json({ success: false, message: 'Select at least one notice category.' }, { status: 400 });
    }
    if (categories.length > 0 && !inAppEnabled && !emailEnabled && !hasServiceEmailPreference) {
      return NextResponse.json({ success: false, message: 'Enable at least one delivery method.' }, { status: 400 });
    }
    if ((emailEnabled || hasServiceEmailPreference) && !isNoticeEmailConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Email delivery is not configured yet. Ask the site administrator to configure SMTP settings.',
      }, { status: 503 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select('email').lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Account not found.' }, { status: 404 });
    }
    if ((emailEnabled || hasServiceEmailPreference) && !user.email) {
      return NextResponse.json({
        success: false,
        message: 'Add an email address to your account before enabling email notices.',
      }, { status: 400 });
    }

    const subscription = await NoticeSubscription.findOneAndUpdate(
      { userId: session.user.id },
      { $set: {
        categories,
        inAppEnabled,
        emailEnabled,
        applicationEmailEnabled,
        appointmentEmailEnabled,
        grievanceEmailEnabled,
      } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({
      success: true,
      message: 'Notice subscription preferences saved.',
      subscription: {
        categories: subscription.categories,
        inAppEnabled: subscription.inAppEnabled,
        emailEnabled: subscription.emailEnabled,
        applicationEmailEnabled: subscription.applicationEmailEnabled,
        appointmentEmailEnabled: subscription.appointmentEmailEnabled,
        grievanceEmailEnabled: subscription.grievanceEmailEnabled,
      },
    });
  } catch (error) {
    console.error('Failed to save notice subscription:', error);
    return NextResponse.json({ success: false, message: 'Unable to save subscription settings.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Please sign in to manage notice subscriptions.' }, { status: 401 });
    }

    await dbConnect();
    const subscription = await NoticeSubscription.findOne({ userId: session.user.id });
    if (subscription) {
      subscription.categories = [];
      subscription.inAppEnabled = false;
      subscription.emailEnabled = false;
      await subscription.save();
      if (!subscription.applicationEmailEnabled && !subscription.appointmentEmailEnabled && !subscription.grievanceEmailEnabled) {
        await NoticeSubscription.deleteOne({ _id: subscription._id });
      }
    }
    return NextResponse.json({ success: true, message: 'Notice subscription removed.' });
  } catch (error) {
    console.error('Failed to remove notice subscription:', error);
    return NextResponse.json({ success: false, message: 'Unable to remove notice subscription.' }, { status: 500 });
  }
}
