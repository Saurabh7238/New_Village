import mongoose from 'mongoose';

const DevelopmentUpdateSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Development',
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  photo: {
    type: String,
    required: true
  },
  photoMimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/webp'],
    required: true
  },
  updateDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const DevelopmentUpdate = mongoose.models.DevelopmentUpdate
  || mongoose.model('DevelopmentUpdate', DevelopmentUpdateSchema);

export default DevelopmentUpdate;
