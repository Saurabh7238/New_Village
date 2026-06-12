import dbConnect from "@/lib/dbConnect";
import Image from "@/models/Image.js";

export async function GET() {
  try {
    console.log('[test-db] Testing database connection...');
    await dbConnect();
    console.log('[test-db] Connected! Counting documents...');
    
    const count = await Image.countDocuments();
    console.log(`[test-db] Found ${count} images`);
    
    if (count > 0) {
      // Try to fetch one without the large image_data field
      const sample = await Image.findOne({}).select('-image_data');
      console.log('[test-db] Sample (without image_data):', sample);
      
      return new Response(JSON.stringify({ 
        connected: true, 
        imageCount: count,
        sample: sample,
        note: 'Sample shown without image_data field'
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ connected: true, imageCount: count }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('[test-db] Error:', error);
    return new Response(JSON.stringify({ 
      connected: false, 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}