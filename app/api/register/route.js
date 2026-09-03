import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { isValidIndianMobile, normalizePhone } from "@/lib/phoneValidation";
import Member from "@/models/Member";
import { createHash } from "crypto";
import { findMemberMatch } from "@/lib/memberRegistrationMatch";
import { isDateOnlyNotInFuture, parseDateOnly } from "@/lib/dateOnly";
import { checkRequestRateLimit } from "@/lib/requestRateLimit";

export async function POST(req) {
  const rateLimit = checkRequestRateLimit(`register:${req.headers.get('x-forwarded-for') || 'local'}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  await dbConnect();

  try {
    const { name, fatherName, email: rawEmail, phone: rawPhone, dateOfBirth, password, ward, aadhaarNumber, profilePhoto } = await req.json();
    const email = rawEmail?.trim().toLowerCase() || null;

    const phone = normalizePhone(rawPhone);

    if (!name?.trim() || !fatherName?.trim() || !email || !phone || !dateOfBirth || !password || !ward || !aadhaarNumber) {
      return NextResponse.json(
        { error: "Name, father's name, email, mobile number, date of birth, ward number, Aadhaar number, and password are required" },
        { status: 400 }
      );
    }

    const parsedDateOfBirth = parseDateOnly(dateOfBirth);
    if (!parsedDateOfBirth || !isDateOnlyNotInFuture(dateOfBirth)) {
      return NextResponse.json({ error: "Enter a valid date of birth" }, { status: 400 });
    }

    if (!isValidIndianMobile(rawPhone)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const wardNumber = ward ? Number(ward) : null;
    if (wardNumber !== null && (!Number.isInteger(wardNumber) || wardNumber < 1 || wardNumber > 50)) {
      return NextResponse.json({ error: "Enter a valid ward number" }, { status: 400 });
    }

    const normalizedAadhaar = aadhaarNumber?.replace(/\s|-/g, "") || "";
    if (normalizedAadhaar && !/^\d{12}$/.test(normalizedAadhaar)) {
      return NextResponse.json({ error: "Aadhaar number must contain 12 digits" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const aadhaarFingerprint = createHash("sha256").update(normalizedAadhaar).digest("hex");
    const existingAadhaarUser = await User.findOne({ aadhaarFingerprint }).select('_id');
    if (existingAadhaarUser) {
      return NextResponse.json({ error: "This Aadhaar number is already registered." }, { status: 400 });
    }

    // Older accounts may not have the fingerprint field yet, so verify their
    // legacy bcrypt hashes before allowing a new account.
    const legacyAadhaarUsers = await User.find({ aadhaarFingerprint: { $exists: false }, aadhaarHash: { $ne: null } }).select('+aadhaarHash');
    for (const existingUser of legacyAadhaarUsers) {
      if (await bcrypt.compare(normalizedAadhaar, existingUser.aadhaarHash || '')) {
        return NextResponse.json({ error: "This Aadhaar number is already registered." }, { status: 400 });
      }
    }

    const duplicateCriteria = [{ phone }];
    if (email) duplicateCriteria.push({ email });
    const existingUser = await User.findOne({ $or: duplicateCriteria });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or mobile number already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const aadhaarHash = normalizedAadhaar ? await bcrypt.hash(normalizedAadhaar, 10) : null;
    const members = await Member.find({}).select('+aadhaarFingerprint');
    const matchedMember = findMemberMatch({
      name,
      fatherName,
      phone,
      aadhaarFingerprint,
      members,
    });

    if (matchedMember?.userId) {
      return NextResponse.json({ error: "This Panchayat member is already registered as a user." }, { status: 400 });
    }

    const uniqueId = matchedMember?.uniqueId || `GP-${uuidv4().slice(0, 8).toUpperCase()}`;

    const user = await User.create({
      name: name.trim(),
      fatherName: typeof fatherName === 'string' ? fatherName.trim() : '',
      email,
      phone,
      password: hashedPassword,
      village: '',
      ward: wardNumber,
      address: '',
      aadhaarHash,
      aadhaarFingerprint,
      aadhaarLast4: normalizedAadhaar ? normalizedAadhaar.slice(-4) : null,
      dateOfBirth: parsedDateOfBirth,
      profilePhoto: typeof profilePhoto === 'string' ? profilePhoto : null,
      isVerified: true,
      uniqueId,
    });

    if (matchedMember) {
      await Member.findByIdAndUpdate(matchedMember._id, { userId: user._id, uniqueId: user.uniqueId });
    }

    await AuditLog.create({
      uniqueId: user.uniqueId,
      action: "CITIZEN_REGISTERED",
      details: { method: "PASSWORD", timestamp: new Date() },
    });

    return NextResponse.json({
      success: true,
      uniqueId: user.uniqueId,
      user: { name: user.name, email: user.email, uniqueId: user.uniqueId },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
