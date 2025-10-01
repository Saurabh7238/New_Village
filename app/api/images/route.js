import { NextResponse } from 'next/server';
// 🛑 FIX: Use relative path to bypass Vercel alias resolution error
import dbConnect from '../../../../lib/dbConnect';
import ImageModel from '@/models/Image';

export async function GET() {
  await dbConnect();

  try {
    // Fetch all image documents from MongoDB
    const images = await ImageModel.find({}).sort({ createdAt: -1 });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json({ error: 'Failed to retrieve images.' }, { status: 500 });
  }
}