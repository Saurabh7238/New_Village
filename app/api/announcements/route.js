import { connectDB } from '@/lib/dbConnect';
import { adminAuth } from '@/lib/adminAuth';
import Announcement from '@/models/Announcement';

export async function GET(req) {
  try {
    await connectDB();

    // Get active announcements for public display
    const now = new Date();
    const announcements = await Announcement.find({
      isVisible: true,
      $or: [
        { visibleFrom: { $lte: now } },
        { visibleFrom: { $exists: false } },
      ],
      $or: [
        { visibleUntil: { $gte: now } },
        { visibleUntil: { $exists: false } },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(5);

    return Response.json(announcements);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await adminAuth(req);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { title, content, type, priority, visibleFrom, visibleUntil } = await req.json();

    const announcement = await Announcement.create({
      title,
      content,
      type,
      priority,
      visibleFrom: visibleFrom ? new Date(visibleFrom) : undefined,
      visibleUntil: visibleUntil ? new Date(visibleUntil) : undefined,
      author: session.user.name,
      isVisible: true,
    });

    return Response.json(announcement, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
