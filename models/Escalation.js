import mongoose from 'mongoose';

const escalationSchema = new mongoose.Schema(
  {
    queryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Query',
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    reason: String,
    escalationLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'in-progress', 'resolved'],
      default: 'pending',
    },
    escalatedBy: String,
    escalatedTo: String,
    daysUnresolved: Number,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Escalation || mongoose.model('Escalation', escalationSchema);
