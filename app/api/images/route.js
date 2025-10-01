import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image';

export async function GET() {
  await dbConnect(); 

  try {
    // Fetch all image metadata from MongoDB
    const images = await ImageModel.find({}).sort({ uploadedAt: -1 });

    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error('Error fetching images from MongoDB:', error);
    return NextResponse.json({ error: 'Failed to fetch images.' }, { status: 500 });
  }
}