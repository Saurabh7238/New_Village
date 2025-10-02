import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db'; 
import ImageModel from '@/models/Image'; 

// IMPORTANT: Cloudinary imports are removed

export async function POST(request) {
  // FIX 1: Using '@/lib/db' which resolves to lib/db.js
  await dbConnect();

  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const file = formData.get('image'); 

    if (!title || !file) {
      return NextResponse.json(
        { success: false, message: 'Missing title or image file in form data.' },
        { status: 400 }
      );
    }
    
    // Check file size (approximate check, MongoDB BSON limit is 16MB)
    if (file.size > 15 * 1024 * 1024) { 
        return NextResponse.json(
            { success: false, message: 'Image file is too large. Please use a smaller file (under 15MB).' },
            { status: 413 }
        );
    }

    // Convert File object to a Base64 data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg'; 
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    
    // Save Base64 data and metadata to MongoDB
    const newImage = new ImageModel({
      title,
      image_data: dataUri, 
      mime_type: mimeType,
    });
    await newImage.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Image uploaded successfully (stored as Base64 in MongoDB)', 
        image: newImage 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to upload image due to a server error.' },
      { status: 500 }
    );
  }
}