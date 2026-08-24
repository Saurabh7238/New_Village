import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  appointmentNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  service: { type: String, trim: true, required: true },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, trim: true, required: true },
  scheduledDate: { type: Date, default: null },
  scheduledTime: { type: String, trim: true, default: '' },
  purpose: { type: String, trim: true, maxlength: 1000, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Rescheduled', 'Cancelled', 'Completed'], default: 'Pending', index: true },
  adminRemarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  statusHistory: [{
    status: String,
    remarks: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

AppointmentSchema.index({ userId: 1, appointmentDate: -1 });
AppointmentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
