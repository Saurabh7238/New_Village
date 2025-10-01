import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect'; // Import your DB connector
import ImageModel from '@/models/Image'; // The updated Mongoose model

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility to convert ArrayBuffer/File to base64 string for Cloudinary upload
const bufferToDataUrl = (buffer, mimeType) => {
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${mimeType};base64,${base64}`;
};

export async function POST(req) {
    await dbConnect(); // Connect to MongoDB

    const formData = await req.formData();
    const file = formData.get('file');
    const title = formData.get('title') || '';
    const tags = formData.get('tags') || '';

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    try {
        // 1. Convert file to data URL
        const buffer = await file.arrayBuffer();
        const mimeType = file.type;
        const dataUrl = bufferToDataUrl(buffer, mimeType);

        // 2. Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUrl, {
            folder: 'gram-panchayat-gallery', 
            resource_type: 'image',
        });

        // 3. Save metadata (Public ID and URL) to MongoDB
        const newImage = new ImageModel({
            publicId: result.public_id, // New field
            secureUrl: result.secure_url, // New field
            title,
            tags: tags.split(',').map(tag => tag.trim()),
        });
        await newImage.save();

        return NextResponse.json({ 
            message: 'File uploaded successfully!', 
            publicId: result.public_id
        });

    } catch (error) {
        console.error('Error uploading file (Cloudinary/MongoDB):', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}