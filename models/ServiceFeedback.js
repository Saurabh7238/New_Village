import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    serviceType: String,
    rating: Number,
    aspects: {
      speed: Number,
      clarity: Number,
      helpfulness: Number,
      accuracy: Number,
    },
    comments: String,
    contactAllowed: Boolean,
    status: {
      type: String,
      enum: ['pending', 'reviewed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.models.ServiceFeedback ||
  mongoose.model('ServiceFeedback', feedbackSchema);
