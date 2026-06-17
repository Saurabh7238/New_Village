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
    const { name, email, phone: rawPhone, password } = await req.json();

    const phone = normalizePhone(rawPhone);

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Name, email, mobile number, and password are required" },
        { status: 400 }
      );
    }

    if (!isValidIndianMobile(rawPhone)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or mobile number already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uniqueId = `GP-${uuidv4().slice(0, 8).toUpperCase()}`;

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
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
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
