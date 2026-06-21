import mongoose from 'mongoose';

const NotificationDocumentSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationBoard',
      required: [true, 'Notification ID is required'],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path/data is required'],
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    uploadedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: false,
  }
);

const NotificationDocument = mongoose.models.NotificationDocument || mongoose.model('NotificationDocument', NotificationDocumentSchema);

export default NotificationDocument;
