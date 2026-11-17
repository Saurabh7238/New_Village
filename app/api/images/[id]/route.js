import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Image not found.' }, { status: 404 });
    }

    await dbConnect();
    const image = await ImageModel.findById(id).select('image_data mime_type').lean();
    if (!image || typeof image.image_data !== 'string') {
      return NextResponse.json({ message: 'Image not found.' }, { status: 404 });
    }

    const dataUriMatch = image.image_data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
    if (!dataUriMatch) {
      return NextResponse.json({ message: 'Image data is invalid.' }, { status: 500 });
    }

    const bytes = Buffer.from(dataUriMatch[2], 'base64');
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': dataUriMatch[1],
        'Content-Length': String(bytes.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (error) {
    console.error('Failed to serve uploaded image:', error);
    return NextResponse.json({ message: 'Unable to load image.' }, { status: 500 });
  }
}
