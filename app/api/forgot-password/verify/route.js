import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { isDateOnlyNotInFuture, parseDateOnly, dateOnlyString } from "@/lib/dateOnly";
import { checkRequestRateLimit } from "@/lib/requestRateLimit";
import { writeAuditLog } from "@/lib/writeAuditLog";
import {
  consumeAuthEmailOtp,
  getOtpErrorResponse,
  sendAuthEmailOtp,
  verifyAuthEmailOtp,
} from "@/lib/authEmailOtp";

async function findRecoveryUser({ email, normalizedAadhaar, parsedDob }) {
  const aadhaarFingerprint = createHash("sha256").update(normalizedAadhaar).digest("hex");
  let user = await User.findOne({ email, aadhaarFingerprint })
    .select("+aadhaarFingerprint +aadhaarHash +password");

  if (!user) {
    const legacyUsers = await User.find({
      email,
      aadhaarFingerprint: { $exists: false },
      aadhaarHash: { $ne: null },
    }).select("+aadhaarHash +password");

    for (const candidate of legacyUsers) {
      if (await bcrypt.compare(normalizedAadhaar, candidate.aadhaarHash || "")) {
        user = candidate;
        break;
      }
    }
  }

  if (!user || (user.status && user.status !== "active") || !user.isVerified) return null;
  if (user.dateOfBirth && dateOnlyString(new Date(user.dateOfBirth)) !== dateOnlyString(parsedDob)) return null;
  return user;
}

function validateRecoveryDetails(body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const normalizedAadhaar = String(body.aadhaarNumber || "").replace(/\s|-/g, "");
  const parsedDob = parseDateOnly(body.dateOfBirth);
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{12}$/.test(normalizedAadhaar) || !parsedDob || !isDateOnlyNotInFuture(body.dateOfBirth)) {
    return null;
  }
  return { email, normalizedAadhaar, parsedDob };
}

export async function POST(request) {
  const rateLimit = checkRequestRateLimit(
    `password-reset:${request.headers.get("x-forwarded-for") || "local"}`,
    { limit: 5, windowMs: 15 * 60 * 1000 }
  );
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many password reset attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const recoveryDetails = validateRecoveryDetails(body);
    if (!recoveryDetails) {
      return NextResponse.json({ error: "Enter a valid email, 12-digit Aadhaar number, and date of birth." }, { status: 400 });
    }

    await dbConnect();
    const user = await findRecoveryUser(recoveryDetails);

    if (body.action === "send") {
      if (user) {
        try {
          await sendAuthEmailOtp({
            userId: user._id,
            purpose: "password-reset",
            email: user.email,
            subject: "Your Gram Panchayat Portal password reset code",
            message: "Use this code to verify your identity and reset your Gram Panchayat Portal password.",
          });
        } catch (error) {
          const response = getOtpErrorResponse(error);
          return NextResponse.json(response.body, { status: response.status });
        }
      }

      return NextResponse.json({
        success: true,
        message: "If those details match an active account, a verification code has been sent.",
      });
    }

    if (body.action !== "verify") {
      return NextResponse.json({ error: "Unsupported password reset action." }, { status: 400 });
    }
    if (!user) {
      return NextResponse.json({ error: "The verification details or code are incorrect or expired." }, { status: 400 });
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const verification = await verifyAuthEmailOtp({
      userId: user._id,
      purpose: "password-reset",
      code,
    });
    if (!verification.valid) {
      const error = verification.reason === "locked"
        ? "Too many incorrect attempts. Request a new code."
        : verification.reason === "expired"
          ? "The verification code expired. Request a new code."
          : "The verification code is incorrect.";
      return NextResponse.json({ error }, { status: verification.reason === "locked" ? 429 : 400 });
    }
    if (!await consumeAuthEmailOtp(verification.challenge)) {
      return NextResponse.json({ error: "The verification code was already used. Request a new code." }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await writeAuditLog({
      action: "Password reset",
      details: { userId: user._id.toString(), method: "EMAIL_OTP_AADHAAR_DOB" },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please sign in with your new password.",
    });
  } catch (error) {
    console.error("Forgot password OTP error:", error);
    return NextResponse.json({ error: "Password reset failed. Please try again." }, { status: 500 });
  }
}
