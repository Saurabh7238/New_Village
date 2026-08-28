import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  applicationNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serviceType: { type: String, enum: ['birth-certificate', 'death-certificate', 'aadhaar-request', 'voter-request', 'other'], required: true, index: true },
  status: { type: String, enum: ['Submitted', 'Under Review', 'Need Documents', 'Approved', 'Rejected', 'Completed'], default: 'Submitted', index: true },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  documents: [{ fileName: String, fileUrl: String, mimeType: String, uploadedAt: { type: Date, default: Date.now } }],
  adminDocuments: [{ fileName: String, fileUrl: String, mimeType: String, uploadedAt: { type: Date, default: Date.now } }],
  adminRemarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

ApplicationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
