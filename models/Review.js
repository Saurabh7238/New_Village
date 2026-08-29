import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Reviewer name is required."],
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
       default: "",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: 1,
      max: 5,
    },
     reasons: { type: [String], default: [] },
     relatedType: { type: String, enum: ["query", "application", "appointment", null], default: null },
     relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    serviceType: { type: String, default: "" },
     outcome: { type: String, enum: ["resolved", "not-resolved"], default: "resolved" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);

export default Review;
