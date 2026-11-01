import mongoose from 'mongoose';
import { SUBSCRIBABLE_NOTICE_CATEGORIES } from '@/lib/notificationConstants';

const NoticeSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    categories: {
      type: [String],
      enum: SUBSCRIBABLE_NOTICE_CATEGORIES,
      default: [],
    },
    inAppEnabled: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: false,
    },
    applicationEmailEnabled: { type: Boolean, default: false },
    appointmentEmailEnabled: { type: Boolean, default: false },
    grievanceEmailEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.NoticeSubscription
  || mongoose.model('NoticeSubscription', NoticeSubscriptionSchema);
