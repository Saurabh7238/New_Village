import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image';
import mongoose from 'mongoose';

// --- GET Function: Fetch images (with optional image_data) ---
export async function GET(request) {
  try {
    console.log('[API/Images] GET request received');
    
    await dbConnect();
    console.log('[API/Images] Database connected');
    
    // Check query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const includeFull = searchParams.get('full') === 'true';
    
    // If specific ID requested, fetch that image with data
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { message: 'Invalid image ID' },
          { status: 400 }
        );
      }
      
      const image = await ImageModel.findById(id).lean();
      if (!image) {
        return NextResponse.json(
          { message: 'Image not found' },
          { status: 404 }
        );
      }
      
      console.log(`[API/Images] Fetched single image: ${id}`);
      return NextResponse.json(image, { status: 200 });
    }
    
    // Otherwise, fetch all images (exclude heavy data by default)
    let query = ImageModel.find({}).sort({ createdAt: -1 });
    
    if (!includeFull) {
      query = query.select('-image_data');
    }
    
    const images = await query.lean();
    console.log(`[API/Images] Fetched ${images.length} images (${includeFull ? 'with' : 'without'} full data)`);
    
    return NextResponse.json(images, { status: 200 });

  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    const errorType = error.name || 'Error';
    
    console.error('[API/Images] Error:', {
      message: errorMessage,
      type: errorType
    });
    
    return NextResponse.json(
      { 
        message: 'Failed to fetch images',
        error: errorMessage,
        type: errorType
      },
      { status: 500 }
    );
  }
}


// --- DELETE Function: Delete image record from MongoDB ---
export async function DELETE(request) {
  try {
    await dbConnect();
    
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
    console.error('Deletion error:', error.message || error);

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete image due to a server error.',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}