import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export async function POST(req) {
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

    const parsedDob = new Date(dateOfBirth);
    if (Number.isNaN(parsedDob.getTime())) {
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
      if (storedDob.toISOString().slice(0, 10) !== parsedDob.toISOString().slice(0, 10)) {
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
