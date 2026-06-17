import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import OtpVerification from "@/models/OtpVerification";
import { isValidIndianMobile, normalizePhone } from "@/lib/phoneValidation";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export async function POST(req) {
  await dbConnect();

  try {
    const { phone: rawPhone } = await req.json();
    const phone = normalizePhone(rawPhone);

    if (!isValidIndianMobile(rawPhone)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json(
        { error: "This mobile number is already registered" },
        { status: 400 }
      );
    }

    const existingOtp = await OtpVerification.findOne({ phone }).sort({
      createdAt: -1,
    });

    if (existingOtp?.createdAt) {
      const secondsSinceLastSend =
        (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000;
      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(
          RESEND_COOLDOWN_SECONDS - secondsSinceLastSend
        );
        return NextResponse.json(
          { error: `Please wait ${waitSeconds}s before requesting a new OTP` },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OtpVerification.findOneAndUpdate(
      { phone },
      {
        phone,
        otpHash: hashOtp(otp),
        expiresAt,
        attempts: 0,
        verificationToken: null,
        tokenExpiresAt: null,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    let smsResult;
    try {
      smsResult = await sendOtpSms(phone, otp);
    } catch (smsError) {
      console.error("SMS send error:", smsError);
      return NextResponse.json(
        {
          error:
            smsError.message ||
            "Could not send OTP SMS. Check your Fast2SMS balance and API key.",
        },
        { status: 502 }
      );
    }

    const response = {
      success: true,
      message: smsResult.sent
        ? "OTP sent to your mobile number"
        : "OTP generated (SMS not configured — see devOtp in development)",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    };

    if (!smsResult.sent) {
      console.log(`[OTP] ${phone}: ${otp} (SMS not configured)`);

      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            error:
              "SMS service is not configured. Add FAST2SMS_API_KEY to enable OTP delivery.",
          },
          { status: 503 }
        );
      }

      response.devOtp = otp;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
