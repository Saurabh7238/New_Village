import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import NotificationDelivery from '@/models/NotificationDelivery';
import { requireAdminSession } from '@/lib/adminAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';
import { sendTrackedEmail } from '@/lib/trackedEmail';

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
    const status = searchParams.get('status');
    const filter = {};
    if (['sent', 'failed', 'skipped', 'sending'].includes(status)) filter.status = status;

    const [deliveries, total] = await Promise.all([
      NotificationDelivery.find(filter)
        .select('-text')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NotificationDelivery.countDocuments(filter),
    ]);

    return NextResponse.json({
      deliveries: deliveries.map((delivery) => ({ ...delivery, id: delivery._id.toString() })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Email delivery history load failed:', error);
    return NextResponse.json({ message: 'Unable to load email delivery history.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    const { id } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'A valid delivery ID is required.' }, { status: 400 });
    }

    await dbConnect();
    const delivery = await NotificationDelivery.findById(id).lean();
    if (!delivery) return NextResponse.json({ message: 'Email delivery record not found.' }, { status: 404 });
    if (delivery.status !== 'failed') {
      return NextResponse.json({ message: 'Only failed email deliveries can be retried.' }, { status: 409 });
    }

    const result = await sendTrackedEmail({
      userId: delivery.userId,
      category: delivery.category,
      eventKey: delivery.eventKey,
      relatedType: delivery.relatedType,
      relatedId: delivery.relatedId,
      subject: delivery.subject,
      text: delivery.text,
    });
    await writeAuditLog({
      session,
      action: 'Email delivery retry requested',
      entityType: 'email-delivery',
      entityId: delivery._id.toString(),
      details: { category: delivery.category, result: result.status },
    });

    return NextResponse.json({ message: `Retry finished with status: ${result.status}.`, result });
  } catch (error) {
    console.error('Email delivery retry failed:', error);
    return NextResponse.json({ message: 'Unable to retry the email delivery.' }, { status: 500 });
  }
}
