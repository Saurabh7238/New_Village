import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true },
  action: { type: String, required: true }, // e.g., "Aadhaar Update Request"
  details: { type: Object },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);