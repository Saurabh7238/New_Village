import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { checkRequestRateLimit } from '@/lib/requestRateLimit';
import CommunityUpdate from '@/models/CommunityUpdate';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ message: 'A valid update ID is required.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const limit = checkRequestRateLimit(`community-view:${ip}`, { limit: 120, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ message: 'View limit reached.' }, { status: 429 });
    }

    await dbConnect();
    const update = await CommunityUpdate.findOneAndUpdate(
      { _id: id, status: 'published' },
      { $inc: { views: 1 } },
      { new: true, projection: 'views' },
    ).lean();

    if (!update) {
      return NextResponse.json({ message: 'Published update not found.' }, { status: 404 });
    }

    return NextResponse.json({ views: update.views }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Community update view tracking failed:', error);
    return NextResponse.json({ message: 'Unable to record this view.' }, { status: 500 });
  }
}
