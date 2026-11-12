import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request) {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const photo = formData.get('photo');
    if (!photo || typeof photo.arrayBuffer !== 'function') {
      return NextResponse.json({ message: 'Choose an image to upload.' }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(photo.type)) {
      return NextResponse.json({ message: 'Choose a JPEG, PNG, WebP, or GIF image.' }, { status: 415 });
    }
    if (!photo.size || photo.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Image must be smaller than 3 MB.' }, { status: 413 });
    }

    const bytes = Buffer.from(await photo.arrayBuffer());
    const profilePhoto = `data:${photo.type};base64,${bytes.toString('base64')}`;
    await dbConnect();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { profilePhoto },
      { new: true, runValidators: true }
    ).select('profilePhoto status').lean();

    if (!user || user.status !== 'active') {
      return NextResponse.json({ message: 'Account unavailable' }, { status: 403 });
    }

    return NextResponse.json({ success: true, profilePhoto: user.profilePhoto });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ message: 'Unable to upload profile photo.' }, { status: 500 });
  }
}