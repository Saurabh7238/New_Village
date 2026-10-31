import mongoose from 'mongoose';

const SiteAssetSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ['logo', 'darkLogo', 'favicon', 'heroImage'],
      required: true,
      unique: true,
    },
    data: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      maxlength: 120,
    },
  },
  { timestamps: true }
);

const SiteAsset = mongoose.models.SiteAsset || mongoose.model('SiteAsset', SiteAssetSchema);

export default SiteAsset;
