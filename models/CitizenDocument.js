import mongoose from 'mongoose';

const CitizenDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null, index: true },
  documentType: { type: String, required: true, default: 'Supporting document' },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: String, enum: ['citizen', 'admin'], required: true },
  source: { type: String, default: 'service-application' },
}, { timestamps: true });

CitizenDocumentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.CitizenDocument || mongoose.model('CitizenDocument', CitizenDocumentSchema);
