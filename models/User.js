import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, select: false }, // Optional for OTP-based registration
  role: { type: String, enum: ["citizen", "user", "staff", "admin"], default: "citizen", index: true },
  uniqueId: { type: String, unique: true }, // The Generated ID
  isVerified: { type: Boolean, default: false },
  village: { type: String, trim: true, default: "" },
  ward: { type: Number, min: 1, max: 50, default: null },
  address: { type: String, trim: true, default: "" },
  // Aadhaar is never stored in plain text. Only a hash and the final four digits are retained.
  aadhaarHash: { type: String, select: false, default: null },
  aadhaarLast4: { type: String, default: null },
  profilePhoto: { type: String, default: null },
  status: { type: String, enum: ["active", "inactive", "suspended"], default: "active", index: true },
}, { timestamps: true });

UserSchema.index({ village: 1, ward: 1 });

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
