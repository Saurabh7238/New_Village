import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
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
      required: [true, "Review message is required."],
      trim: true,
    },
    approved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);

export default Review;
