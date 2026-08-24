import mongoose from 'mongoose';

const AdminNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  relatedType: { type: String, default: 'application' },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true });

AdminNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.AdminNotification || mongoose.model('AdminNotification', AdminNotificationSchema);
