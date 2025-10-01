import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
// 🛑 FIX: Use the final, correct relative path (two levels up)
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const buffer = await streamToBuffer(file.stream());
    const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'gram-panchayat-portal',
    });

    const newImage = new ImageModel({
      title: title,
      publicId: result.public_id,
      secureUrl: result.secure_url,
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