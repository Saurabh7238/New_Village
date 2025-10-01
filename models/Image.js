import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
    // Store Cloudinary's Public ID (used for deletion)
    publicId: { 
        type: String,
        required: true,
        unique: true,
    },
    // Store the secure URL (used for display in the gallery)
    secureUrl: { 
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: 'Untitled',
    },
    tags: [String],
    uploadedAt: { 
        type: Date, 
        default: Date.now 
    },
}, { timestamps: true });

export default mongoose.models.Image || mongoose.model("Image", ImageSchema);