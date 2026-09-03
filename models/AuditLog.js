import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  userName: { type: String, default: null },
  userEmail: { type: String, default: null },
  uniqueId: { type: String, default: null },
  action: { type: String, required: true },
  entityType: { type: String, default: null },
  entityId: { type: String, default: null },
  details: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);