import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  // 🛑 CRITICAL: New fields for Cloudinary integration
  publicId: {
    type: String,
    required: true,
    unique: true,
  },
  secureUrl: {
    type: String, 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);