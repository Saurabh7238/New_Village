import mongoose from 'mongoose';
import { NOTIFICATION_TYPES, NOTIFICATION_LEVELS, NOTIFICATION_PRIORITIES, NOTIFICATION_STATUS, NOTIFICATION_CATEGORIES } from '@/lib/notificationConstants';

const NotificationBoardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: [true, 'Notification type is required (message, circular, or order)'],
    },
    level: {
      type: String,
      enum: NOTIFICATION_LEVELS,
      required: [true, 'Notification level is required (national, state, or zila_panchayat)'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    issueDate: {
      type: Date,
      default: () => new Date(),
    },
    validTill: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: 'medium',
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUS,
      default: 'draft',
    },
    createdBy: {
      type: String,
      required: [true, 'Creator ID is required'],
    },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES,
      default: 'announcement',
    },
    scheduledPublishDate: {
      type: Date,
      default: null,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
NotificationBoardSchema.index({ type: 1, level: 1, status: 1 });
NotificationBoardSchema.index({ category: 1, status: 1 });
NotificationBoardSchema.index({ status: 1, validTill: 1 });
NotificationBoardSchema.index({ scheduledPublishDate: 1 });
NotificationBoardSchema.index({ createdAt: -1 });
NotificationBoardSchema.index({ title: 'text', description: 'text' });

const NotificationBoard = mongoose.models.NotificationBoard || mongoose.model('NotificationBoard', NotificationBoardSchema);

export default NotificationBoard;
