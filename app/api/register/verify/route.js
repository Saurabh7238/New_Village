import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Member from '@/models/Member';
import { checkRequestRateLimit } from '@/lib/requestRateLimit';
import {
  consumeAuthEmailOtp,
  getOtpErrorResponse,
  sendAuthEmailOtp,
  verifyAuthEmailOtp,
} from '@/lib/authEmailOtp';
import AuditLog from '@/models/AuditLog';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export async function POST(request) {
  const rateLimit = checkRequestRateLimit(
    `signup-verification:${request.headers.get('x-forwarded-for') || 'local'}`,
    { limit: 10, windowMs: 15 * 60 * 1000 }
  );
  if (!rateLimit.allowed) {
    return NextResponse.json({ message: 'Too many verification attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email, status: 'active' }).select('email isVerified');

    if (body.action === 'send') {
      if (user && !user.isVerified) {
        try {
          await sendAuthEmailOtp({
            userId: user._id,
            purpose: 'signup',
            email: user.email,
            subject: 'Verify your Gram Panchayat Portal email',
            message: 'Use this code to verify the email address for your new Gram Panchayat Portal account.',
          });
        } catch (error) {
          const response = getOtpErrorResponse(error);
          return NextResponse.json(response.body, { status: response.status });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'If your account needs email verification, a code has been sent.',
      });
    }

    if (body.action !== 'verify') {
      return NextResponse.json({ message: 'Unsupported verification action.' }, { status: 400 });
    }
    if (!user || user.isVerified) {
      return NextResponse.json({ message: 'The verification code is invalid or expired.' }, { status: 400 });
    }

    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const verification = await verifyAuthEmailOtp({ userId: user._id, purpose: 'signup', code });
    if (!verification.valid) {
      const status = verification.reason === 'locked' ? 429 : 400;
      const message = verification.reason === 'expired'
        ? 'The verification code expired. Request a new code.'
        : verification.reason === 'locked'
          ? 'Too many incorrect attempts. Request a new code.'
          : 'The verification code is incorrect.';
      return NextResponse.json({ message }, { status });
    }

    if (!await consumeAuthEmailOtp(verification.challenge)) {
      return NextResponse.json({ message: 'The verification code was already used. Request a new code.' }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, isVerified: false, status: 'active' },
      { isVerified: true },
      { new: true }
    ).select('name email uniqueId');
    if (!updatedUser) {
      return NextResponse.json({ message: 'Account unavailable. Please contact the Panchayat office.' }, { status: 403 });
    }

    await Member.findOneAndUpdate(
      { uniqueId: updatedUser.uniqueId, $or: [{ userId: null }, { userId: { $exists: false } }] },
      { $set: { userId: updatedUser._id } }
    );

    await AuditLog.create({
      uniqueId: updatedUser.uniqueId,
      action: 'CITIZEN_EMAIL_VERIFIED',
      details: { method: 'EMAIL_OTP', timestamp: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Email verified. You can now sign in.' });
  } catch (error) {
    console.error('Signup email verification error:', error);
    return NextResponse.json({ message: 'Unable to verify your email. Please try again.' }, { status: 500 });
  }
}
