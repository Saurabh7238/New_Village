import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  await dbConnect();
  try {
    const { phone, otp, name, email, password } = await req.json();

    // If password is provided, do password-based registration
    if (password) {
      // Validation
      if (!name || !email || !phone || !password) {
        return NextResponse.json(
          { error: 'Name, email, phone, and password are required' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email or phone already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique ID before creating user
      const uniqueId = `GP-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Create user
      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        isVerified: true,
        uniqueId, // Explicitly set uniqueId
      });

      // Create audit log with confirmed uniqueId
      await AuditLog.create({
        uniqueId: user.uniqueId || uniqueId,
        action: 'CITIZEN_REGISTERED',
        details: { method: 'PASSWORD', timestamp: new Date() }
      });

      return NextResponse.json({
        success: true,
        uniqueId: user.uniqueId,
        user: { name: user.name, email: user.email }
      });
    }

    // OTP-based registration (original flow)
    if (otp !== '123456') {
      return NextResponse.json({ error: 'Invalid OTP verification failed.' }, { status: 401 });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      const uniqueId = `GP-${uuidv4().slice(0, 8).toUpperCase()}`;
      user = await User.create({ name, email, phone, isVerified: true, uniqueId });
    }

    await AuditLog.create({
      uniqueId: user.uniqueId,
      action: 'CITIZEN_REGISTERED_VERIFIED',
      details: { method: 'OTP', timestamp: new Date() }
    });

    return NextResponse.json({ success: true, uniqueId: user.uniqueId, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
