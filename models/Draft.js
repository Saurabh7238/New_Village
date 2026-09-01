import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceType: String,
    title: String,
    data: mongoose.Schema.Types.Mixed,
    isDraft: {
      type: Boolean,
      default: true,
    },
    lastSavedAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true }
);

// Add index to auto-delete expired drafts
draftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Draft || mongoose.model('Draft', draftSchema);
