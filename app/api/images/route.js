import { NextResponse } from 'next/server';
// 🛑 FIX: Use the final, correct relative path (two levels up)
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image.js';

export async function GET() {
  await dbConnect();

  try {
    const images = await ImageModel.find({}).sort({ createdAt: -1 });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json({ error: 'Failed to retrieve images.' }, { status: 500 });
  }
}