import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendAuthEmailOtp, getOtpErrorResponse } from '@/lib/authEmailOtp';
import { normalizePhone } from '@/lib/phoneValidation';
import { checkRequestRateLimit } from '@/lib/requestRateLimit';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  const rateLimit = checkRequestRateLimit(`login-otp:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ message: 'Too many sign-in attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const identifier = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    if (!identifier || !password) {
      return NextResponse.json({ message: 'Enter your email or mobile number and password.' }, { status: 400 });
    }

    const normalizedIdentifier = identifier.includes('@')
      ? identifier.toLowerCase()
      : normalizePhone(identifier);

    await dbConnect();
    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }],
    }).select('+password email status isVerified');

    if (!user?.password || !await bcrypt.compare(password, user.password)) {
      return NextResponse.json({ message: 'Incorrect mobile/email or password.' }, { status: 401 });
    }
    if (user.status && user.status !== 'active') {
      return NextResponse.json({ message: 'This account is not active. Contact the Panchayat office.' }, { status: 403 });
    }
    if (!user.isVerified) {
      return NextResponse.json({ message: 'Verify your email address from the sign-up page before signing in.' }, { status: 403 });
    }
    if (!user.email) {
      return NextResponse.json({ message: 'An email address is required for OTP sign-in. Contact the Panchayat office.' }, { status: 403 });
    }

    try {
      const delivery = await sendAuthEmailOtp({
        userId: user._id,
        purpose: 'login',
        email: user.email,
        subject: 'Your Gram Panchayat Portal sign-in code',
        message: 'Use this code to complete sign-in to your Gram Panchayat Portal account.',
      });
      return NextResponse.json({
        success: true,
        email: delivery.email,
        message: `A sign-in code was sent to ${delivery.email}.`,
      });
    } catch (error) {
      const response = getOtpErrorResponse(error);
      return NextResponse.json(response.body, { status: response.status });
    }
  } catch (error) {
    console.error('Sign-in OTP request failed:', error);
    return NextResponse.json({ message: 'Unable to start sign-in. Please try again.' }, { status: 500 });
  }
}
