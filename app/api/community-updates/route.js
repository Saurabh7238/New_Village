import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import { checkRequestRateLimit } from '@/lib/requestRateLimit';
import CommunityUpdate from '@/models/CommunityUpdate';

export const runtime = 'nodejs';

const KINDS = ['facility', 'camp', 'outage', 'lost-found', 'meeting', 'event'];
const SCHEDULED_KINDS = ['camp', 'meeting', 'event'];
const PUBLIC_FIELDS = 'kind title description location schedule startsAt endsAt status isLost views createdAt';

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizePayload(payload) {
  const kind = payload?.kind;
  const title = cleanText(payload?.title, 120);
  const description = cleanText(payload?.description, 2000);
  const location = cleanText(payload?.location, 200);
  const schedule = cleanText(payload?.schedule, 300);
  const startsAt = payload?.startsAt ? new Date(payload.startsAt) : undefined;
  const endsAt = payload?.endsAt ? new Date(payload.endsAt) : undefined;

  if (!KINDS.includes(kind) || title.length < 3 || description.length < 5) {
    return { error: 'Choose a category and provide a title and description.' };
  }
  if ((startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    return { error: 'Enter valid start and end dates.' };
  }
  if (SCHEDULED_KINDS.includes(kind) && !startsAt) {
    return { error: 'A start date and time is required for meetings, camps, and events.' };
  }
  if (startsAt && endsAt && endsAt < startsAt) {
    return { error: 'The end date must be after the start date.' };
  }

  return {
    value: {
      kind,
      title,
      description,
      location,
      schedule,
      startsAt,
      endsAt,
      isLost: kind === 'lost-found' && Boolean(payload.isLost),
    },
  };
}

export async function GET(request) {
  try {
    await dbConnect();
    const wantsAdmin = new URL(request.url).searchParams.get('admin') === 'true';
    const wantsScheduled = new URL(request.url).searchParams.get('scheduled') === 'true';
    const adminSession = wantsAdmin ? await requireAdminSession() : null;
    if (wantsAdmin && !adminSession) {
      return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
    }

    const now = new Date();
    const query = adminSession
      ? {}
      : wantsScheduled
        ? {
            status: 'published',
            kind: { $in: SCHEDULED_KINDS },
            startsAt: { $gte: now },
            $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }],
          }
        : {
          status: 'published',
          $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }],
        };
    const updatesQuery = CommunityUpdate.find(query).sort({ startsAt: 1, createdAt: -1 }).limit(adminSession ? 300 : 100);
    if (!adminSession) updatesQuery.select(PUBLIC_FIELDS);
    const updates = await updatesQuery.lean();

    return NextResponse.json({
      updates: updates.map((item) => ({
        ...item,
        id: item._id.toString(),
        views: Number.isSafeInteger(item.views) ? item.views : null,
        ...(adminSession ? {} : { reporterName: undefined, reporterContact: undefined, _id: undefined }),
      })),
    }, { headers: { 'Cache-Control': adminSession ? 'no-store' : 'public, max-age=60, stale-while-revalidate=300' } });
  } catch (error) {
    console.error('Community updates fetch failed:', error);
    return NextResponse.json({ message: 'Unable to load community updates.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await requireAdminSession();
    const payload = await request.json();
    const isPublicLostFoundSubmission = !session && payload?.kind === 'lost-found';
    if (!session && !isPublicLostFoundSubmission) {
      return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
    }

    if (isPublicLostFoundSubmission) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
      const limit = checkRequestRateLimit(`lost-found:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 });
      if (!limit.allowed) {
        return NextResponse.json({ message: 'Submission limit reached. Please try again later.' }, { status: 429 });
      }
    }

    const normalized = normalizePayload(payload);
    if (normalized.error) return NextResponse.json({ message: normalized.error }, { status: 400 });
    if (isPublicLostFoundSubmission && !normalized.value.location) {
      return NextResponse.json({ message: 'Add where the item was lost or found.' }, { status: 400 });
    }

    await dbConnect();
    const update = await CommunityUpdate.create({
      ...normalized.value,
      status: isPublicLostFoundSubmission ? 'pending' : 'published',
      reporterName: isPublicLostFoundSubmission ? cleanText(payload.reporterName, 100) : '',
      reporterContact: isPublicLostFoundSubmission ? cleanText(payload.reporterContact, 100) : '',
      createdBy: session?.user?.name || 'Resident submission',
    });

    return NextResponse.json({
      success: true,
      message: isPublicLostFoundSubmission
        ? 'Submitted for review. Your contact details will only be visible to administrators.'
        : 'Community update published.',
      id: update._id.toString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Community update creation failed:', error);
    return NextResponse.json({ message: 'Unable to submit the community update.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

    const payload = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ message: 'A valid update is required.' }, { status: 400 });
    }
    const { id } = payload;
    const allowedStatuses = ['published', 'rejected', 'resolved'];
    if (typeof id !== 'string' || !mongooseIdIsValid(id)) {
      return NextResponse.json({ message: 'A valid update ID is required.' }, { status: 400 });
    }

    const update = {};
    if (allowedStatuses.includes(payload.status)) update.status = payload.status;
    if (Object.hasOwn(payload, 'title') || Object.hasOwn(payload, 'description') || Object.hasOwn(payload, 'location') || Object.hasOwn(payload, 'schedule') || Object.hasOwn(payload, 'startsAt') || Object.hasOwn(payload, 'endsAt')) {
      const normalized = normalizePayload(payload);
      if (normalized.error) return NextResponse.json({ message: normalized.error }, { status: 400 });
      Object.assign(update, normalized.value);
    }
    if (!Object.keys(update).length) {
      return NextResponse.json({ message: 'A valid status or update content is required.' }, { status: 400 });
    }

    await dbConnect();
    const saved = await CommunityUpdate.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!saved) return NextResponse.json({ message: 'Community update not found.' }, { status: 404 });
    return NextResponse.json({ success: true, id: saved._id.toString(), status: saved.status });
  } catch (error) {
    console.error('Community update moderation failed:', error);
    return NextResponse.json({ message: 'Unable to update the community listing.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

    const { id } = await request.json();
    if (typeof id !== 'string' || !mongooseIdIsValid(id)) {
      return NextResponse.json({ message: 'A valid update ID is required.' }, { status: 400 });
    }

    await dbConnect();
    const result = await CommunityUpdate.deleteOne({ _id: id });
    if (!result.deletedCount) return NextResponse.json({ message: 'Community update not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Community update deletion failed:', error);
    return NextResponse.json({ message: 'Unable to remove the community listing.' }, { status: 500 });
  }
}

function mongooseIdIsValid(id) {
  return /^[a-f\d]{24}$/i.test(id);
}
