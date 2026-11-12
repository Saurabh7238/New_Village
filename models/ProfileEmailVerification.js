import mongoose from 'mongoose';

const ProfileEmailVerificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  email: { type: String, default: null },
  phone: { type: String, required: true },
  deliveryEmail: { type: String, required: true },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

ProfileEmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ProfileEmailVerification
  || mongoose.model('ProfileEmailVerification', ProfileEmailVerificationSchema);