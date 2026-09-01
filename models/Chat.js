import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["user", "bot"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ["hi", "en", "hinglish"],
      default: "en",
    },
    service: String,
    ward: Number,
    ticket: String,
  },
  { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
