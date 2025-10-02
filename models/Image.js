import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the image.'],
    maxlength: [60, 'Title cannot be more than 60 characters.'],
  },
  // Stores the full Base64 data URI (e.g., 'data:image/png;base64,...')
  image_data: { 
    type: String, 
    required: true,
  },
  mime_type: {
    type: String, 
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);