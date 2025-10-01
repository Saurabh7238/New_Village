import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
// FIX: Changed from '@/lib/dbConnect' to '@/lib/db'
import dbConnect from '@/lib/db'; 
import ImageModel from '@/models/Image.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to convert a buffer to a data URI
function bufferToDataURI(buffer) {
  const base64 = buffer.toString('base64');
  return `data:application/octet-stream;base64,${base64}`;
}

export async function POST(request) {
  try {
    await dbConnect();

    // The request body includes 'title' and the file data
    const formData = await request.formData();
    const title = formData.get('title');
    const file = formData.get('image');

    if (!title || !file) {
      return NextResponse.json(
        { success: false, message: 'Missing title or image file' },
        { status: 400 }
      );
    }

    // Convert file to buffer and then to data URI for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dataUri = bufferToDataURI(buffer);

    // Upload to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(dataUri, {
      folder: 'my-village-uploads', // Customize your folder name
      resource_type: 'auto',
    });

    // Save metadata to MongoDB
    const newImage = new ImageModel({
      title,
      publicId: cloudinaryResponse.public_id,
      secureUrl: cloudinaryResponse.secure_url,
    });
    await newImage.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Image uploaded successfully', 
        image: newImage 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}