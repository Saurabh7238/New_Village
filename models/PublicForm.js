import mongoose from 'mongoose';

const PublicFormSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  service: { type: String, required: true, enum: ['birth', 'death', 'grievance', 'voter'] },
  language: { type: String, required: true, enum: ['en', 'hi', 'bilingual'] },
  fileName: { type: String, required: true, maxlength: 150 },
  fileData: { type: Buffer, required: true },
  fileSize: { type: Number, required: true },
  sourceNote: { type: String, required: true, trim: true, maxlength: 300 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

PublicFormSchema.index({ service: 1, createdAt: -1 });

export default mongoose.models.PublicForm || mongoose.model('PublicForm', PublicFormSchema);
