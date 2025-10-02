import dbConnect from "@/lib/db";
import Image from "@/models/Image.js";

export async function GET() {
  try {
    await connectDB();
    const count = await Image.countDocuments();
    return new Response(JSON.stringify({ connected: true, imageCount: count }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ connected: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}