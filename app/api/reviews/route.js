import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Review from "@/models/Review";
import User from "@/models/User";
import Query from "@/models/Query";
import Application from "@/models/Application";
import Appointment from "@/models/Appointment";
import ServiceNotification from "@/models/ServiceNotification";
import { requireAdminSession } from "@/lib/adminAuth";
import { requireAuthenticatedSession } from "@/lib/sessionAuth";

const SEED_REVIEWS = [
  {
    name: "Rekha Devi",
    ward: "Ward 3",
    message: "This portal made it so easy to get my birth certificate!",
    rating: 5,
    status: "approved",
    approved: true,
  },
];
const REVIEW_REASONS = ["Fast response", "Issue solved", "Clear communication", "Issue not solved", "Slow response"];

async function ensureSeedReviews() {
  const count = await Review.countDocuments();
  if (count === 0) {
    await Review.insertMany(SEED_REVIEWS);
  }
}

export async function GET() {
  try {
    const session = await requireAuthenticatedSession();
    await dbConnect();
    await ensureSeedReviews();

    const reviews = await Review.find(session?.user?.role === "admin" ? {} : { $or: [{ status: "approved" }, { status: { $exists: false }, approved: true }] })
      .sort({ createdAt: -1 })
      .limit(50);

    const responseData = reviews.map((r) => ({
      ...r.toObject(),
      id: r._id.toString(),
    }));

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.warn("GET Reviews skipped: MongoDB unavailable.", error?.message || error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const session = await requireAuthenticatedSession();
    if (!session) return NextResponse.json({ message: "Please sign in before submitting a review." }, { status: 401 });
    await dbConnect();
    const { message, rating, reasons = [], relatedType = null, relatedId = null, outcome = "resolved" } = await request.json();
    const comment = typeof message === "string" ? message.trim() : "";
    const user = await User.findById(session.user.id).select("name ward status");
    const numericRating = Number(rating);

    if (!user || user.status !== "active") return NextResponse.json({ message: "Your account is unavailable." }, { status: 403 });
    const selectedReasons = Array.isArray(reasons) ? reasons.filter((reason) => REVIEW_REASONS.includes(reason)) : [];
    if (!comment && selectedReasons.length === 0 || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { message: "Select at least one reason or add a comment, with a rating from 1 to 5." },
        { status: 400 }
      );
    }

    let relatedRecord = null;
    if (relatedType && !["query", "application", "appointment"].includes(relatedType)) {
      return NextResponse.json({ message: "Invalid request type." }, { status: 400 });
    }
    if ((relatedType && !relatedId) || (!relatedType && relatedId)) {
      return NextResponse.json({ message: "A valid request link is required." }, { status: 400 });
    }
    if (relatedType && relatedId && mongoose.Types.ObjectId.isValid(relatedId)) {
      const models = { query: Query, application: Application, appointment: Appointment };
      relatedRecord = await models[relatedType]?.findOne({ _id: relatedId, userId: user._id });
      if (!relatedRecord) return NextResponse.json({ message: "The selected request was not found." }, { status: 404 });
      const existingReview = await Review.findOne({ userId: user._id, relatedType, relatedId });
      if (existingReview) return NextResponse.json({ message: "You have already submitted feedback for this request." }, { status: 409 });
    }
    if (relatedType && !mongoose.Types.ObjectId.isValid(relatedId)) {
      return NextResponse.json({ message: "A valid request link is required." }, { status: 400 });
    }

    const newReview = await Review.create({
      userId: user._id,
      name: user.name,
      ward: user.ward ? `Ward ${user.ward}` : "",
      message: comment,
      rating: numericRating,
      reasons: selectedReasons,
      relatedType: relatedRecord ? relatedType : null,
      relatedId: relatedRecord?._id || null,
      serviceType: relatedRecord ? relatedType === "query" ? `query:${relatedRecord.category}` : relatedType === "application" ? relatedRecord.serviceType : "appointment" : "",
      outcome: outcome === "not-resolved" ? "not-resolved" : "resolved",
      status: "pending",
      approved: false,
    });

    if (relatedRecord && outcome === "not-resolved") {
      const reopenUpdates = {
        query: { status: "In Progress", resolvedAt: null },
        application: { status: "Under Review" },
        appointment: { status: "Pending" },
      };
      await { query: Query, application: Application, appointment: Appointment }[relatedType].findByIdAndUpdate(relatedRecord._id, reopenUpdates[relatedType]);
      await ServiceNotification.findOneAndUpdate(
        { relatedType, relatedId: relatedRecord._id },
        {
          $set: { adminIsRead: false, adminAcknowledgedAt: null, adminResponded: null, isRead: true },
          $setOnInsert: {
            userId: user._id,
            serviceType: relatedType === "query" ? `query:${relatedRecord.category}` : relatedType === "application" ? relatedRecord.serviceType : "appointment",
            queryRaised: relatedRecord.createdAt,
          },
        },
        { upsert: true },
      );
    }

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
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ message: "Admin access required." }, { status: 403 });
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

export async function PUT(request) {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ message: "Admin access required." }, { status: 403 });
    await dbConnect();
    const { id, status, adminRemarks = "" } = await request.json();
    if (!id || !mongoose.Types.ObjectId.isValid(id) || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "A valid review and decision are required." }, { status: 400 });
    }
    const review = await Review.findByIdAndUpdate(id, {
      status,
      approved: status === "approved",
      adminRemarks: String(adminRemarks).trim().slice(0, 500),
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    }, { new: true, runValidators: true });
    if (!review) return NextResponse.json({ message: "Review not found." }, { status: 404 });
    return NextResponse.json({ ...review.toObject(), id: review._id.toString() });
  } catch (error) {
    console.error("PUT Review Error:", error);
    return NextResponse.json({ message: "Failed to update review." }, { status: 500 });
  }
}
