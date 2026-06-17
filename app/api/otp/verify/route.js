import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import OtpVerification from "@/models/OtpVerification";
import { isValidIndianMobile, normalizePhone } from "@/lib/phoneValidation";
import { generateVerificationToken, verifyOtp } from "@/lib/otp";

const MAX_ATTEMPTS = 5;
const TOKEN_EXPIRY_MINUTES = 15;

export async function POST(req) {
  await dbConnect();

  try {
    const { phone: rawPhone, otp } = await req.json();
    const phone = normalizePhone(rawPhone);

    if (!isValidIndianMobile(rawPhone)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      return NextResponse.json(
        { error: "Enter the 6-digit OTP" },
        { status: 400 }
      );
    }

    const record = await OtpVerification.findOne({ phone });

    if (!record?.otpHash || !record.expiresAt) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    if (!verifyOtp(otp, record.otpHash)) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json(
        { error: "Invalid OTP. Please try again." },
        { status: 401 }
      );
    }

    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    record.otpHash = null;
    record.verificationToken = verificationToken;
    record.tokenExpiresAt = tokenExpiresAt;
    record.expiresAt = tokenExpiresAt;
    await record.save();

    return NextResponse.json({
      success: true,
      message: "Mobile number verified successfully",
      verificationToken,
      phone,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "OTP verification failed. Please try again." },
      { status: 500 }
    );
  }
}
