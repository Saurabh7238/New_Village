import { NextResponse } from 'next/server';
import Member from '@/models/Member';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';

export async function POST(request) {
  await connectDB();

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const {
      id,
      fullName,
      designation,
      wardNo,
      photo,
      mobileNumber,
      whatsappNumber,
      emailId,
      tenureStart,
      tenureEnd,
      status,
      fatherHusbandName,
      address,
      education,
      committees,
      joiningDate,
      gender,
      category,
      displayOrder
    } = data;

    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid member ID format.' }, { status: 400 });
    }

    if (!fullName || !designation || !mobileNumber || !tenureStart || !tenureEnd) {
      return NextResponse.json(
        { message: 'Full name, designation, mobile number, tenure start and end dates are required.' },
        { status: 400 }
      );
    }

    const payload = {
      fullName,
      designation,
      wardNo: wardNo || null,
      photo: photo || null,
      mobileNumber,
      whatsappNumber: whatsappNumber || null,
      emailId: emailId || null,
      tenureStart,
      tenureEnd,
      status: status || 'Active',
      fatherHusbandName: fatherHusbandName || null,
      address: address || null,
      education: education || null,
      committees: committees || [],
      joiningDate: joiningDate || null,
      gender: gender || null,
      category: category || null,
      displayOrder: displayOrder || 999
    };

    let savedMember;

    if (id) {
      savedMember = await Member.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
      if (!savedMember) {
        return NextResponse.json({ message: 'Member not found.' }, { status: 404 });
      }
    } else {
      const newMember = new Member(payload);
      savedMember = await newMember.save();
    }

    return NextResponse.json(savedMember, { status: id ? 200 : 201 });
  } catch (error) {
    console.error('API POST/PUT Error:', error);
    return NextResponse.json({ message: 'Failed to process member record.' }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();

  try {
    const members = await Member.find({}).sort({ displayOrder: 1, createdAt: -1 });
    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch members list.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  await connectDB();

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await request.json().catch(() => ({}));
    const { id } = data;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'A valid ID is required for deletion.' }, { status: 400 });
    }

    const deletedMember = await Member.findByIdAndDelete(id);

    if (!deletedMember) {
      return NextResponse.json({ message: 'Member not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Member deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({ message: 'Failed to delete member.' }, { status: 500 });
  }
}
