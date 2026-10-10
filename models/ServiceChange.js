import mongoose from "mongoose";

const ServiceChangeSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    submittedByName: { type: String, default: "" },
    method: { type: String, enum: ["POST", "PUT", "PATCH", "DELETE"], required: true },
    path: { type: String, required: true },
    contentType: { type: String, default: "" },
    body: { type: Buffer, default: Buffer.alloc(0) },
    preview: { type: mongoose.Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected", "failed"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedByName: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    reviewMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

ServiceChangeSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ServiceChange || mongoose.model("ServiceChange", ServiceChangeSchema);
