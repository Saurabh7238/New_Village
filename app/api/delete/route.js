import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    await dbConnect();

    const { publicId, _id } = await request.json();

    if (!publicId || !_id) {
      return NextResponse.json(
        { success: false, message: 'Missing publicId or _id' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Delete from MongoDB
    await ImageModel.findByIdAndDelete(_id);

    return NextResponse.json(
      { success: true, message: 'Image deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Deletion error:', error.message || error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete image', error: error.message },
      { status: 500 }
    );
  }
}