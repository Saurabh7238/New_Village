import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OTP-based registration
  role: { type: String, default: "user" }, // For admin access
  uniqueId: { type: String, unique: true }, // The Generated ID
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Generate unique ID before saving if not present
UserSchema.pre('save', function(next) {
  if (!this.uniqueId) {
    this.uniqueId = `GP-${uuidv4().slice(0, 8).toUpperCase()}`;
  }
  next();
});

// Also generate uniqueId on create if not provided
UserSchema.pre('insertOne', function(next) {
  if (this._doc && !this._doc.uniqueId) {
    this._doc.uniqueId = `GP-${uuidv4().slice(0, 8).toUpperCase()}`;
  }
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);