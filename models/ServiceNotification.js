import mongoose from 'mongoose';

// One record is created for every citizen request.  It is deliberately separate
// from public announcement notifications so it can never be shown to another user.
const ServiceNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serviceType: { type: String, required: true, trim: true, index: true },
  relatedType: { type: String, enum: ['application', 'appointment', 'query'], required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  queryRaised: { type: Date, default: Date.now, index: true },
  adminResponded: { type: Date, default: null, index: true },
  isRead: { type: Boolean, default: false, index: true },
  adminIsRead: { type: Boolean, default: false, index: true },
  adminAcknowledgedAt: { type: Date, default: null },
}, { timestamps: true });

ServiceNotificationSchema.index({ relatedType: 1, relatedId: 1 }, { unique: true });
ServiceNotificationSchema.index({ userId: 1, isRead: 1, adminResponded: 1 });
ServiceNotificationSchema.index({ adminIsRead: 1, serviceType: 1, queryRaised: -1 });

export default mongoose.models.ServiceNotification || mongoose.model('ServiceNotification', ServiceNotificationSchema);
