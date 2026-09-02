import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import HomeSettings from '@/models/HomeSettings';

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const settings = await HomeSettings.findOne({ name: 'default' }).lean();

    return Response.json({
      settings: settings || {
        name: 'default',
        popupEnabled: true,
        popupTitle: 'Important Update',
        popupMessage: 'Gram Sabha will be held on the scheduled date at the Panchayat Bhavan.',
        popupLink: '',
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

    const settings = await HomeSettings.findOneAndUpdate(
      { name: 'default' },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return Response.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving home settings:', error);
    return Response.json({ error: 'Failed to save home settings' }, { status: 500 });
  }
}
