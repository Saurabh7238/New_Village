import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Review from "@/models/Review";

const SEED_REVIEWS = [
  {
    name: "Rekha Devi",
    ward: "Ward 3",
    message: "This portal made it so easy to get my birth certificate!",
    approved: true,
  },
];

async function ensureSeedReviews() {
  const count = await Review.countDocuments();
  if (count === 0) {
    await Review.insertMany(SEED_REVIEWS);
  }
}

export async function GET() {
  try {
    await dbConnect();
    await ensureSeedReviews();

    const reviews = await Review.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(50);

    const responseData = reviews.map((r) => ({
      ...r.toObject(),
      id: r._id.toString(),
    }));

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("GET Reviews Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const { name, ward, message } = await request.json();

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json(
        { message: "Name and review message are required." },
        { status: 400 }
      );
    }

    const newReview = await Review.create({
      name: name.trim(),
      ward: ward?.trim() || "",
      message: message.trim(),
      approved: true,
    });

    const responseData = {
      ...newReview.toObject(),
      id: newReview._id.toString(),
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("POST Review Error:", error);
    return NextResponse.json(
      { message: "Failed to submit review." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid review ID is required." },
        { status: 400 }
      );
    }

    const deleted = await Review.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Review not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Review deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Review Error:", error);
    return NextResponse.json(
      { message: "Failed to delete review." },
      { status: 500 }
    );
  }
}
