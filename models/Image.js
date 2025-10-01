import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  // 🛑 CRITICAL: New fields for Cloudinary integration
  publicId: {
    type: String, // Used to identify and delete the file from Cloudinary
    required: true,
    unique: true,
  },
  secureUrl: {
    type: String, // Used to display the image on the client side
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);