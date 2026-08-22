import mongoose from 'mongoose';

const QueryMessageSchema = new mongoose.Schema({
  queryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Query', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['citizen', 'staff', 'admin'], required: true },
  message: { type: String, trim: true, maxlength: 4000, required: true },
  attachment: {
    fileName: String,
    fileUrl: String,
    mimeType: String,
  },
}, { timestamps: true });

QueryMessageSchema.index({ queryId: 1, createdAt: 1 });

export default mongoose.models.QueryMessage || mongoose.model('QueryMessage', QueryMessageSchema);
