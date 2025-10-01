import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect'; // Assuming you use this
import ImageModel from '@/models/Image';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bufferToDataUrl = (buffer, mimeType) => {
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${mimeType};base64,${base64}`;
};

export async function POST(req) {
    await dbConnect();
    const formData = await req.formData();
    const file = formData.get('file');
    const title = formData.get('title') || '';
    const tags = formData.get('tags') || '';

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    try {
        const buffer = await file.arrayBuffer();
        const dataUrl = bufferToDataUrl(buffer, file.type);

        // 1. Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUrl, {
            folder: 'gram-panchayat-gallery',
            resource_type: 'image',
        });

        // 2. Save metadata to MongoDB
        const newImage = new ImageModel({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            title,
            tags: tags.split(',').map(tag => tag.trim()),
        });
        await newImage.save();

        return NextResponse.json({ message: 'File uploaded successfully!', publicId: result.public_id });
    } catch (error) {
        console.error('Error uploading file (Cloudinary/MongoDB):', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}