import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { isValidIndianMobile, normalizePhone } from "@/lib/phoneValidation";

export async function POST(req) {
  await dbConnect();

  try {
    const { name, email: rawEmail, phone: rawPhone, password, village, ward, address, aadhaarNumber, profilePhoto } = await req.json();
    const email = rawEmail?.trim().toLowerCase() || null;

    const phone = normalizePhone(rawPhone);

    if (!name?.trim() || !phone || !password || !village?.trim() || !ward || !address?.trim()) {
      return NextResponse.json(
        { error: "Name, mobile number, village, ward, address, and password are required" },
        { status: 400 }
      );
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
    const uniqueId = `GP-${uuidv4().slice(0, 8).toUpperCase()}`;

    const user = await User.create({
      name: name.trim(),
      email,
      phone,
      password: hashedPassword,
      village: village?.trim() || '',
      ward: wardNumber,
      address: address?.trim() || '',
      aadhaarHash,
      aadhaarLast4: normalizedAadhaar ? normalizedAadhaar.slice(-4) : null,
      profilePhoto: typeof profilePhoto === 'string' ? profilePhoto : null,
      isVerified: true,
      uniqueId,
    });

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
