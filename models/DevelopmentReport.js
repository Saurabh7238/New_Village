import mongoose from 'mongoose';

const DevelopmentReportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Development',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['Stalled work', 'Quality concern', 'Safety concern', 'Incorrect project information', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  }
}, { timestamps: true });

DevelopmentReportSchema.index({ projectId: 1, status: 1, createdAt: -1 });

const DevelopmentReport = mongoose.models.DevelopmentReport
  || mongoose.model('DevelopmentReport', DevelopmentReportSchema);

export default DevelopmentReport;
