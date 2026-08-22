import mongoose from 'mongoose';

const CitizenNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true, maxlength: 160, required: true },
  message: { type: String, trim: true, maxlength: 1000, required: true },
  type: { type: String, enum: ['query', 'application', 'appointment', 'message', 'system'], default: 'system' },
  relatedType: { type: String, default: null },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true });

CitizenNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.CitizenNotification || mongoose.model('CitizenNotification', CitizenNotificationSchema);
