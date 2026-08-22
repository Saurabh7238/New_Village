import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  appointmentNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  service: { type: String, trim: true, required: true },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, trim: true, required: true },
  purpose: { type: String, trim: true, maxlength: 1000, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Rescheduled', 'Cancelled', 'Completed'], default: 'Pending', index: true },
  adminRemarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

AppointmentSchema.index({ userId: 1, appointmentDate: -1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
