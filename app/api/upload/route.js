import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ImageModel from '@/models/Image';

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function parseTags(tagsValue) {
  if (!tagsValue || typeof tagsValue !== 'string') return [];
  return tagsValue.split(',').map((t) => t.trim()).filter(Boolean);
}

async function fileToDataUri(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || 'image/jpeg';
  return {
    dataUri: `data:${mimeType};base64,${buffer.toString('base64')}`,
    mimeType,
  };
}

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const title = formData.get('title');
    const file = formData.get('image');

    if (!title || !file) {
      return NextResponse.json(
        { success: false, message: 'Missing title or image file in form data.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Image file is too large. Please use a smaller file (under 15MB).' },
        { status: 413 }
      );
    }

    const { dataUri, mimeType } = await fileToDataUri(file);

    const newImage = new ImageModel({
      title,
      image_data: dataUri,
      mime_type: mimeType,
      tags: parseTags(formData.get('tags')),
    });
    await newImage.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Image uploaded successfully (stored as Base64 in MongoDB)',
        image: newImage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error.message || error);

    return NextResponse.json(
      { success: false, message: 'Failed to upload image due to a server error.', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing image id for update.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const file = formData.get('image');

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required.' },
        { status: 400 }
      );
    }

    const update = {
      title,
      tags: parseTags(formData.get('tags')),
    };

    if (file && typeof file.size === 'number' && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: 'Image file is too large. Please use a smaller file (under 15MB).' },
          { status: 413 }
        );
      }

      const { dataUri, mimeType } = await fileToDataUri(file);
      update.image_data = dataUri;
      update.mime_type = mimeType;
    }

    const updatedImage = await ImageModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updatedImage) {
      return NextResponse.json(
        { success: false, message: 'Image not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Image updated successfully.',
        image: updatedImage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update error:', error.message || error);

    return NextResponse.json(
      { success: false, message: 'Failed to update image due to a server error.', error: error.message },
      { status: 500 }
    );
  }
}
