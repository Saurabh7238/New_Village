import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';
import { isValidIndianMobile, normalizePhone } from '@/lib/phoneValidation';
import { sendSmtpEmail } from '@/lib/noticeSubscriptionEmail';
import ProfileEmailVerification from '@/models/ProfileEmailVerification';
import User from '@/models/User';

const PROFILE_FIELDS = 'name fatherName phone email village ward address profilePhoto uniqueId role status aadhaarLast4 createdAt';
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(userId, code) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for profile email verification.');
  return createHmac('sha256', secret).update(`${userId}:${code}`).digest('hex');
}

async function findContactConflict(userId, email, phone) {
  const filters = [{ phone, _id: { $ne: userId } }];
  if (email) filters.push({ email, _id: { $ne: userId } });
  return User.findOne({ $or: filters }).select('_id').lean();
}

export async function POST(request) {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await dbConnect();
    const user = await User.findById(session.user.id).select('email phone status').lean();
    if (!user || user.status !== 'active') {
      return NextResponse.json({ message: 'Account unavailable' }, { status: 403 });
    }

    if (body.action === 'send') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() || null : null;
      const phone = typeof body.phone === 'string' ? normalizePhone(body.phone) : null;
      if (!isValidIndianMobile(body.phone)) {
        return NextResponse.json({ message: 'Enter a valid 10-digit mobile number.' }, { status: 400 });
      }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
      }
      if (email === (user.email || null) && phone === user.phone) {
        return NextResponse.json({ message: 'No contact changes to verify.' }, { status: 400 });
      }

      const deliveryEmail = email || user.email;
      if (!deliveryEmail) {
        return NextResponse.json({ message: 'Add an email address before changing your mobile number.' }, { status: 400 });
      }
      if (await findContactConflict(user._id, email, phone)) {
        return NextResponse.json({ message: 'This mobile number or email is already in use.' }, { status: 409 });
      }

      const existingChallenge = await ProfileEmailVerification.findOne({ userId: user._id }).select('lastSentAt').lean();
      const waitMs = existingChallenge ? RESEND_WAIT_MS - (Date.now() - existingChallenge.lastSentAt.getTime()) : 0;
      if (waitMs > 0) {
        return NextResponse.json({
          message: `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`,
        }, { status: 429 });
      }

      const code = String(randomInt(100000, 1000000));
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
      await ProfileEmailVerification.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            email,
            phone,
            deliveryEmail,
            codeHash: hashCode(user._id.toString(), code),
            attempts: 0,
            lastSentAt: now,
            expiresAt,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      try {
        await sendSmtpEmail({
          to: deliveryEmail,
          subject: 'Your profile contact verification code',
          text: `Your verification code is ${code}. Enter it in your Gram Panchayat profile to confirm the contact update. This code expires in 10 minutes. If you did not request this, you can ignore this email.`,
        });
      } catch (error) {
        await ProfileEmailVerification.deleteOne({ userId: user._id });
        console.error('Profile verification email failed:', error);
        return NextResponse.json({ message: 'Unable to send the verification email. Please try again later.' }, { status: 503 });
      }

      return NextResponse.json({ success: true, message: `A verification code was sent to ${deliveryEmail}.` });
    }

    if (body.action === 'verify') {
      const code = typeof body.code === 'string' ? body.code.trim() : '';
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ message: 'Enter the 6-digit verification code.' }, { status: 400 });
      }

      const challenge = await ProfileEmailVerification.findOne({ userId: user._id }).select('+codeHash');
      if (!challenge || challenge.expiresAt <= new Date()) {
        if (challenge) await challenge.deleteOne();
        return NextResponse.json({ message: 'The verification code expired. Request a new code.' }, { status: 400 });
      }
      if (challenge.attempts >= MAX_ATTEMPTS) {
        await challenge.deleteOne();
        return NextResponse.json({ message: 'Too many incorrect attempts. Request a new code.' }, { status: 429 });
      }

      const submittedHash = Buffer.from(hashCode(user._id.toString(), code), 'hex');
      const expectedHash = Buffer.from(challenge.codeHash, 'hex');
      if (submittedHash.length !== expectedHash.length || !timingSafeEqual(submittedHash, expectedHash)) {
        challenge.attempts += 1;
        if (challenge.attempts >= MAX_ATTEMPTS) await challenge.deleteOne();
        else await challenge.save();
        return NextResponse.json({ message: 'The verification code is incorrect.' }, { status: 400 });
      }

      if (await findContactConflict(user._id, challenge.email, challenge.phone)) {
        await challenge.deleteOne();
        return NextResponse.json({ message: 'This mobile number or email is already in use. Request a new code.' }, { status: 409 });
      }

      const update = { phone: challenge.phone, email: challenge.email };
      const updatedUser = await User.findByIdAndUpdate(user._id, update, { new: true, runValidators: true })
        .select(PROFILE_FIELDS)
        .lean();
      await challenge.deleteOne();
      return NextResponse.json({
        success: true,
        user: { ...updatedUser, id: updatedUser._id.toString() },
      });
    }

    return NextResponse.json({ message: 'Unsupported verification action.' }, { status: 400 });
  } catch (error) {
    console.error('Profile email verification error:', error);
    return NextResponse.json({ message: 'Unable to process contact verification.' }, { status: 500 });
  }
}