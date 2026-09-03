import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { isDateOnlyNotInFuture, parseDateOnly, dateOnlyString } from "@/lib/dateOnly";
import { checkRequestRateLimit } from "@/lib/requestRateLimit";
import { writeAuditLog } from "@/lib/writeAuditLog";

export async function POST(req) {
  const rateLimit = checkRequestRateLimit(`password-reset:${req.headers.get('x-forwarded-for') || 'local'}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many password reset attempts. Please try again later." }, { status: 429 });
  await dbConnect();

  try {
    const { aadhaarNumber, dateOfBirth, password } = await req.json();
    const normalizedAadhaar = String(aadhaarNumber || "").replace(/\s|-/g, "");

    if (!/^\d{12}$/.test(normalizedAadhaar)) {
      return NextResponse.json(
        { error: "Enter a valid 12-digit Aadhaar number" },
        { status: 400 }
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: "Date of birth is required" },
        { status: 400 }
      );
    }

    const parsedDob = parseDateOnly(dateOfBirth);
    if (!parsedDob || !isDateOnlyNotInFuture(dateOfBirth)) {
      return NextResponse.json(
        { error: "Enter a valid date of birth" },
        { status: 400 }
      );
    }

    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const aadhaarFingerprint = createHash("sha256").update(normalizedAadhaar).digest("hex");
    const user = await User.findOne({
      $or: [{ aadhaarFingerprint }, { aadhaarHash: { $ne: null } }],
    }).select("+aadhaarHash +password");

    if (!user) {
      return NextResponse.json(
        { error: "Aadhaar number and date of birth do not match any account." },
        { status: 404 }
      );
    }

    const aadhaarMatches =
      user.aadhaarFingerprint === aadhaarFingerprint ||
      (user.aadhaarHash && (await bcrypt.compare(normalizedAadhaar, user.aadhaarHash)));

    if (!aadhaarMatches) {
      return NextResponse.json(
        { error: "Aadhaar number and date of birth do not match any account." },
        { status: 404 }
      );
    }

    if (user.dateOfBirth) {
      const storedDob = new Date(user.dateOfBirth);
      if (dateOnlyString(storedDob) !== dateOnlyString(parsedDob)) {
        return NextResponse.json(
          { error: "Aadhaar number and date of birth do not match any account." },
          { status: 404 }
        );
      }
    } else {
      user.dateOfBirth = parsedDob;
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await writeAuditLog({ action: "Password reset", details: { userId: user._id.toString(), method: "AADHAAR_DOB" } });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please sign in with your new password.",
    });
  } catch (error) {
    console.error("Forgot password verify error:", error);
    return NextResponse.json(
      { error: "Password reset failed. Please try again." },
      { status: 500 }
    );
  }
}
