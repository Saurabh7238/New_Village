import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import AuthEmailOtp from '@/models/AuthEmailOtp';
import { sendSmtpEmail } from '@/lib/noticeSubscriptionEmail';

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(userId, purpose, code) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for email OTP verification.');
  return createHmac('sha256', secret).update(`${userId}:${purpose}:${code}`).digest('hex');
}

export function maskEmail(email) {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  const [domainName, ...domainSuffix] = domain.split('.');
  const maskedLocal = `${localPart[0]}${'*'.repeat(Math.max(2, localPart.length - 1))}`;
  const maskedDomain = `${domainName[0]}${'*'.repeat(Math.max(2, domainName.length - 1))}`;
  return `${maskedLocal}@${maskedDomain}.${domainSuffix.join('.')}`;
}

export async function sendAuthEmailOtp({ userId, purpose, email, subject, message }) {
  const existing = await AuthEmailOtp.findOne({ userId, purpose }).select('lastSentAt').lean();
  const waitMs = existing ? RESEND_WAIT_MS - (Date.now() - existing.lastSentAt.getTime()) : 0;
  if (waitMs > 0) {
    const error = new Error(`Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`);
    error.code = 'OTP_RESEND_WAIT';
    error.retryAfter = Math.ceil(waitMs / 1000);
    throw error;
  }

  const code = String(randomInt(100000, 1000000));
  const now = new Date();
  const challenge = await AuthEmailOtp.findOneAndUpdate(
    { userId, purpose },
    {
      $set: {
        codeHash: hashCode(userId.toString(), purpose, code),
        attempts: 0,
        lastSentAt: now,
        expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendSmtpEmail({
      to: email,
      subject,
      text: `${message}\n\nYour verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    });
  } catch (error) {
    await AuthEmailOtp.deleteOne({ _id: challenge._id });
    throw error;
  }

  return { email: maskEmail(email) };
}

export async function verifyAuthEmailOtp({ userId, purpose, code }) {
  if (!/^\d{6}$/.test(code)) return { valid: false, reason: 'invalid' };

  const challenge = await AuthEmailOtp.findOne({ userId, purpose }).select('+codeHash');
  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) await challenge.deleteOne();
    return { valid: false, reason: 'expired' };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await challenge.deleteOne();
    return { valid: false, reason: 'locked' };
  }

  const submittedHash = Buffer.from(hashCode(userId.toString(), purpose, code), 'hex');
  const expectedHash = Buffer.from(challenge.codeHash, 'hex');
  if (submittedHash.length !== expectedHash.length || !timingSafeEqual(submittedHash, expectedHash)) {
    challenge.attempts += 1;
    if (challenge.attempts >= MAX_ATTEMPTS) await challenge.deleteOne();
    else await challenge.save();
    return { valid: false, reason: challenge.attempts >= MAX_ATTEMPTS ? 'locked' : 'invalid' };
  }

  return { valid: true, challenge };
}

export async function consumeAuthEmailOtp(challenge) {
  const result = await AuthEmailOtp.deleteOne({ _id: challenge._id });
  return result.deletedCount === 1;
}

export function getOtpErrorResponse(error) {
  if (error.code === 'OTP_RESEND_WAIT') {
    return {
      status: 429,
      body: { message: error.message, retryAfter: error.retryAfter },
    };
  }
  console.error('Email OTP delivery failed:', error);
  return {
    status: 503,
    body: { message: 'Unable to send a verification email. Please try again later.' },
  };
}
