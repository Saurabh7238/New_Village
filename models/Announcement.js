import mongoose from 'mongoose';

const announceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['service-update', 'maintenance', 'alert', 'news'],
      default: 'service-update',
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    visibleFrom: Date,
    visibleUntil: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    author: String,
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model('Announcement', announceSchema);
