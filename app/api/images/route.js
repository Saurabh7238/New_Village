import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db'; 
import ImageModel from '@/models/Image';

// --- GET Function: Fetch all images (with Base64 data) ---
export async function GET() {
  // FIX 1: Using '@/lib/db'
  await dbConnect();

  try {
    const images = await ImageModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(images, { status: 200 });

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch images' }, { status: 500 });
  }
}


// --- DELETE Function: Delete image record from MongoDB ---
export async function DELETE(request) {
  // FIX 1: Using '@/lib/db'
  await dbConnect();
  
  try {
    // We expect the MongoDB document ID (_id) from the client
    const { imageId } = await request.json(); 

    if (!imageId) {
      return NextResponse.json(
        { success: false, message: 'Missing imageId for deletion.' },
        { status: 400 }
      );
    }
    
    // Delete the record from MongoDB using the _id
    const dbResult = await ImageModel.deleteOne({ _id: imageId });

    if (dbResult.deletedCount === 0) {
        return NextResponse.json(
            { success: false, message: 'Image record not found in database.' },
            { status: 404 }
        );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Image record deleted successfully from MongoDB.'
      },
      { status: 200 } 
    );
  } catch (error) {
    console.error('Deletion error:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to delete image due to a server error.' },
      { status: 500 }
    );
  }
}