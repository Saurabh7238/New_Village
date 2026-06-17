import mongoose from "mongoose";

const OtpVerificationSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otpHash: { type: String },
  expiresAt: { type: Date },
  attempts: { type: Number, default: 0 },
  verificationToken: { type: String },
  tokenExpiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OtpVerification ||
  mongoose.model("OtpVerification", OtpVerificationSchema);
