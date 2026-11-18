import mongoose from 'mongoose';

const CommunityUpdateSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['facility', 'camp', 'outage', 'lost-found', 'meeting', 'event'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120, trim: true },
    description: { type: String, required: true, maxlength: 2000, trim: true },
    location: { type: String, default: '', maxlength: 200, trim: true },
    schedule: { type: String, default: '', maxlength: 300, trim: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'published', 'rejected', 'resolved'],
      default: 'published',
      index: true,
    },
    isLost: { type: Boolean, default: false },
    views: { type: Number, default: 0, min: 0 },
    reporterName: { type: String, default: '', maxlength: 100, trim: true },
    reporterContact: { type: String, default: '', maxlength: 100, trim: true },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

const CommunityUpdate = mongoose.models.CommunityUpdate
  || mongoose.model('CommunityUpdate', CommunityUpdateSchema);

export default CommunityUpdate;
