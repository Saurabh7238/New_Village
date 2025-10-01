import { NextResponse } from 'next/server';
// FIX: Changed from '@/lib/dbConnect' to '@/lib/db'
import dbConnect from '@/lib/db'; 
import ImageModel from '@/models/Image.js';

export async function GET() {
  try {
    await dbConnect();
    const images = await ImageModel.find({});
    return NextResponse.json({ success: true, data: images }, { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}