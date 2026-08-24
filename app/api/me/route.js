import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';
import { isValidIndianMobile, normalizePhone } from '@/lib/phoneValidation';

const PROFILE_FIELDS = 'name phone email village ward address profilePhoto uniqueId role status aadhaarLast4 createdAt';

export async function GET() {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.user.id).select(PROFILE_FIELDS).lean();
    if (!user || user.status !== 'active') return NextResponse.json({ message: 'Account unavailable' }, { status: 403 });

    return NextResponse.json({ user: { ...user, id: user._id.toString() } });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Unable to load profile' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const update = {};
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
    if (typeof body.village === 'string') update.village = body.village.trim();
    if (typeof body.address === 'string') update.address = body.address.trim();
    if (typeof body.profilePhoto === 'string') update.profilePhoto = body.profilePhoto.trim().slice(0, 2000) || null;
    if (body.ward !== undefined) {
      const ward = Number(body.ward);
      if (!Number.isInteger(ward) || ward < 1 || ward > 50) return NextResponse.json({ message: 'Enter a valid ward number' }, { status: 400 });
      update.ward = ward;
    }
    if (body.phone) {
      if (!isValidIndianMobile(body.phone)) return NextResponse.json({ message: 'Enter a valid 10-digit mobile number' }, { status: 400 });
      update.phone = normalizePhone(body.phone);
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ message: 'Enter a valid email address' }, { status: 400 });
      update.email = email || null;
    }
    if (!Object.keys(update).length) return NextResponse.json({ message: 'No profile changes supplied' }, { status: 400 });

    await dbConnect();
    const duplicateFilters = [];
    if (update.phone) duplicateFilters.push({ phone: update.phone, _id: { $ne: session.user.id } });
    if (update.email) duplicateFilters.push({ email: update.email, _id: { $ne: session.user.id } });
    if (duplicateFilters.length && await User.findOne({ $or: duplicateFilters })) {
      return NextResponse.json({ message: 'This mobile number or email is already in use' }, { status: 409 });
    }
    const user = await User.findByIdAndUpdate(session.user.id, update, { new: true, runValidators: true }).select(PROFILE_FIELDS).lean();
    return NextResponse.json({ user: { ...user, id: user._id.toString() } });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Unable to update profile' }, { status: 500 });
  }
}
