import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
// 🛑 FIX: Use relative path to bypass Vercel alias resolution error
import dbConnect from '../../../../lib/dbConnect';
import ImageModel from '@/models/Image';

// Configure Cloudinary using Vercel environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility function to convert stream to buffer
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(req) {
  await dbConnect();

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const title = formData.get('title') || 'Untitled';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Convert file to a buffer
    const buffer = await streamToBuffer(file.stream());
    // Convert buffer to Base64 data URL
    const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 1. Upload to Cloudinary (replaces local file system storage)
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'gram-panchayat-portal', // Optional: your specific folder
    });

    // 2. Save metadata to MongoDB
    const newImage = new ImageModel({
      title: title,
      publicId: result.public_id, // Store Cloudinary ID for later deletion
      secureUrl: result.secure_url, // Store URL for display
    });
    await newImage.save();

    return NextResponse.json({ 
      message: 'File uploaded successfully!', 
      image: newImage 
    }, { status: 201 });

  } catch (error) {
    console.error('Error during file upload/save:', error);
    return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
  }
}