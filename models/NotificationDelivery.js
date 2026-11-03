import mongoose from 'mongoose';

const NotificationDeliverySchema = new mongoose.Schema({
  eventKey: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, enum: ['notice', 'application', 'appointment', 'grievance'], required: true, index: true },
  relatedType: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  allowWithoutPreference: { type: Boolean, default: false },
  recipientEmailMasked: { type: String, default: '' },
  subject: { type: String, required: true, maxlength: 200 },
  text: { type: String, required: true, maxlength: 4000 },
  status: { type: String, enum: ['sending', 'sent', 'failed', 'skipped'], default: 'failed', index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: '' },
  sentAt: { type: Date, default: null },
}, { timestamps: true });

NotificationDeliverySchema.index({ status: 1, updatedAt: -1 });

export default mongoose.models.NotificationDelivery
  || mongoose.model('NotificationDelivery', NotificationDeliverySchema);
