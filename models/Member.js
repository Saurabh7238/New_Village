import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  uniqueId: {
    type: String,
    default: null,
    index: true
  },
  aadhaarLast4: {
    type: String,
    default: null
  },
  aadhaarFingerprint: {
    type: String,
    default: null,
    select: false,
    unique: true,
    sparse: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: ['Gram Pradhan', 'Up-Pradhan', 'Panchayat Secretary', 'Ward Member', 'Rozgar Sevak', 'Panchayat Sahayak', 'Other']
  },
  wardNo: {
    type: Number,
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^\d{10}$|^\d{3}-\d{3}-\d{4}$|^\d{3} \d{3} \d{4}$|^\+91\d{10}$/, 'Please provide a valid mobile number']
  },
  whatsappNumber: {
    type: String,
    default: null,
    match: [/^$|^\d{10}$|^\d{3}-\d{3}-\d{4}$|^\d{3} \d{3} \d{4}$|^\+91\d{10}$/, 'Please provide a valid WhatsApp number']
  },
  emailId: {
    type: String,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  tenureStart: {
    type: Date,
    required: true
  },
  tenureEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Ex-Member'],
    default: 'Active'
  },
  fatherHusbandName: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  education: {
    type: String,
    default: null
  },
  committees: {
    type: [String],
    default: []
  },
  joiningDate: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: null
  },
  category: {
    type: String,
    enum: ['General', 'OBC', 'SC', 'ST'],
    default: null
  },
  displayOrder: {
    type: Number,
    default: 999
  }
}, {
  timestamps: true
});

const Member = mongoose.models.Member || mongoose.model('Member', MemberSchema);

export default Member;
