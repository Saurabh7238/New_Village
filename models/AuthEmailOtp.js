import mongoose from 'mongoose';

const AuthEmailOtpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  purpose: { type: String, enum: ['signup', 'login', 'password-reset'], required: true },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

AuthEmailOtpSchema.index({ userId: 1, purpose: 1 }, { unique: true });
AuthEmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AuthEmailOtp || mongoose.model('AuthEmailOtp', AuthEmailOtpSchema);
