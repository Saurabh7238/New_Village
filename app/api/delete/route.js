import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(req) {
  await dbConnect();
  
  // The client must send the publicId, not the filename
  const publicId = req.nextUrl.searchParams.get('publicId'); 

  if (!publicId) {
    return NextResponse.json({ error: 'Missing Public ID.' }, { status: 400 });
  }

  try {
    // 1. Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // 2. Delete the record from MongoDB
    await ImageModel.deleteOne({ publicId });

    return NextResponse.json({ message: 'File deleted successfully!' });
  } catch (error) {
    console.error('Error deleting file (Cloudinary/MongoDB):', error);
    return NextResponse.json({ error: 'Failed to delete file.' }, { status: 500 });
  }
}