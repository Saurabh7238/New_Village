import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Development from '@/models/Development';
import DevelopmentUpdate from '@/models/DevelopmentUpdate';
import { requireServiceManagerSession } from '@/lib/adminAuth';

const MAX_PHOTO_BYTES = 1024 * 1024;
const PHOTO_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/;

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid project ID.' }, { status: 400 });
    }
    await dbConnect();
    const project = await Development.findById(id).select('_id');
    if (!project) return NextResponse.json({ message: 'Project not found.' }, { status: 404 });

    const updates = await DevelopmentUpdate.find({ projectId: id })
      .select('description photo photoMimeType updateDate createdAt')
      .sort({ updateDate: -1, createdAt: -1 })
      .lean();
    return NextResponse.json(updates);
  } catch (error) {
    console.error('Failed to load project photo updates:', error);
    return NextResponse.json({ message: 'Failed to load project photo updates.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await requireServiceManagerSession();
    if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid project ID.' }, { status: 400 });
    }
    const body = await request.json();
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const updateDate = new Date(body.updateDate);
    const photoMatch = typeof body.photo === 'string' ? body.photo.match(PHOTO_PATTERN) : null;

    if (!description || description.length > 500 || !Number.isFinite(updateDate.getTime()) || !photoMatch) {
      return NextResponse.json({ message: 'A date, description, and JPEG, PNG, or WebP photo are required.' }, { status: 400 });
    }
    if (photoMatch[2].length > Math.ceil(MAX_PHOTO_BYTES * 4 / 3) + 4) {
      return NextResponse.json({ message: 'Photo must be 1 MB or smaller.' }, { status: 413 });
    }
    if (Buffer.from(photoMatch[2], 'base64').byteLength > MAX_PHOTO_BYTES) {
      return NextResponse.json({ message: 'Photo must be 1 MB or smaller.' }, { status: 413 });
    }

    await dbConnect();
    const project = await Development.findById(id).select('_id');
    if (!project) return NextResponse.json({ message: 'Project not found.' }, { status: 404 });

    const update = await DevelopmentUpdate.create({
      projectId: id,
      createdBy: session.user.id,
      description,
      updateDate,
      photo: body.photo,
      photoMimeType: photoMatch[1]
    });
    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    console.error('Failed to save project photo update:', error);
    return NextResponse.json({ message: 'Failed to save project photo update.' }, { status: 500 });
  }
}
