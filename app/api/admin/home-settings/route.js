import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import HomeSettings from '@/models/HomeSettings';
import SiteAsset from '@/models/SiteAsset';
import { writeAuditLog } from '@/lib/writeAuditLog';

export async function GET() {
  try {
    await dbConnect();
    const settings = await HomeSettings.findOne({ name: 'default' }).lean();
    const assets = await SiteAsset.find({}).select('key mimeType updatedAt').lean();
    const branding = Object.fromEntries(assets.map((asset) => [
      asset.key,
      {
        url: `/api/site-assets/${asset.key}?v=${new Date(asset.updatedAt).getTime()}`,
        mimeType: asset.mimeType,
      },
    ]));

    return Response.json({
      settings: {
        ...(settings || {
          name: 'default',
          popupEnabled: true,
          popupTitle: 'Important Update',
          popupMessage: 'Gram Sabha will be held on the scheduled date at the Panchayat Bhavan.',
          popupLink: '',
          galleryProtectionEnabled: false,
          noticeEmailNotificationsEnabled: true,
          applicationEmailNotificationsEnabled: true,
          appointmentEmailNotificationsEnabled: true,
          grievanceEmailNotificationsEnabled: true,
          slides: [
            {
              title: 'Village Services',
              imageUrl: '/slide.png',
              alt: 'Village services banner',
              href: '/grievance',
            },
            {
              title: 'Voter Services',
              imageUrl: '/voter.png',
              alt: 'Voter list banner',
              href: '/voter',
            },
            {
              title: 'Panchayat Campus',
              imageUrl: '/panchayat.jpg',
              alt: 'Panchayat campus banner',
              href: '/about',
            },
          ],
        }),
        noticeEmailNotificationsEnabled: settings?.noticeEmailNotificationsEnabled !== false,
        applicationEmailNotificationsEnabled: settings?.applicationEmailNotificationsEnabled !== false,
        appointmentEmailNotificationsEnabled: settings?.appointmentEmailNotificationsEnabled !== false,
        grievanceEmailNotificationsEnabled: settings?.grievanceEmailNotificationsEnabled !== false,
        branding,
      },
    });
  } catch (error) {
    console.error('Error fetching home settings:', error);
    return Response.json({ error: 'Failed to fetch home settings' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const payload = await req.json();

    const safeSlides = Array.isArray(payload.slides)
      ? payload.slides.map((slide) => ({
          title: String(slide?.title || '').trim(),
          imageUrl: String(slide?.imageUrl || '').trim(),
          alt: String(slide?.alt || '').trim(),
          href: String(slide?.href || '').trim(),
        })).filter((slide) => slide.imageUrl)
      : [];

    const update = {
      name: 'default',
      popupEnabled: Boolean(payload.popupEnabled),
      popupTitle: String(payload.popupTitle || 'Important Update').trim() || 'Important Update',
      popupMessage: String(payload.popupMessage || '').trim() || 'Gram Sabha will be held on the scheduled date at the Panchayat Bhavan.',
      popupLink: String(payload.popupLink || '').trim(),
      slides: safeSlides.length ? safeSlides : [
        {
          title: 'Village Services',
          imageUrl: '/slide.png',
          alt: 'Village services banner',
          href: '/grievance',
        },
      ],
    };

    if (typeof payload.galleryProtectionEnabled === 'boolean') {
      update.galleryProtectionEnabled = payload.galleryProtectionEnabled;
    }
    if (typeof payload.noticeEmailNotificationsEnabled === 'boolean') {
      update.noticeEmailNotificationsEnabled = payload.noticeEmailNotificationsEnabled;
    }
    if (typeof payload.applicationEmailNotificationsEnabled === 'boolean') {
      update.applicationEmailNotificationsEnabled = payload.applicationEmailNotificationsEnabled;
    }
    if (typeof payload.appointmentEmailNotificationsEnabled === 'boolean') {
      update.appointmentEmailNotificationsEnabled = payload.appointmentEmailNotificationsEnabled;
    }
    if (typeof payload.grievanceEmailNotificationsEnabled === 'boolean') {
      update.grievanceEmailNotificationsEnabled = payload.grievanceEmailNotificationsEnabled;
    }

    const settings = await HomeSettings.findOneAndUpdate(
      { name: 'default' },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    await writeAuditLog({
      session,
      action: 'Homepage settings updated',
      entityType: 'home-settings',
      details: { fields: Object.keys(update) },
    });

    return Response.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving home settings:', error);
    return Response.json({ error: 'Failed to save home settings' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const update = {};
    for (const setting of [
      'galleryProtectionEnabled',
      'noticeEmailNotificationsEnabled',
      'applicationEmailNotificationsEnabled',
      'appointmentEmailNotificationsEnabled',
      'grievanceEmailNotificationsEnabled',
    ]) {
      if (typeof payload[setting] === 'boolean') update[setting] = payload[setting];
    }
    if (!Object.keys(update).length) {
      return Response.json({ error: 'A supported setting is required.' }, { status: 400 });
    }

    await dbConnect();
    const settings = await HomeSettings.findOneAndUpdate(
      { name: 'default' },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    await writeAuditLog({
      session,
      action: 'Notification email settings updated',
      entityType: 'home-settings',
      details: update,
    });

    return Response.json({
      success: true,
      galleryProtectionEnabled: settings.galleryProtectionEnabled,
      noticeEmailNotificationsEnabled: settings.noticeEmailNotificationsEnabled !== false,
      applicationEmailNotificationsEnabled: settings.applicationEmailNotificationsEnabled !== false,
      appointmentEmailNotificationsEnabled: settings.appointmentEmailNotificationsEnabled !== false,
      grievanceEmailNotificationsEnabled: settings.grievanceEmailNotificationsEnabled !== false,
    });
  } catch (error) {
    console.error('Error updating home settings:', error);
    return Response.json({ error: 'Failed to update home settings.' }, { status: 500 });
  }
}
