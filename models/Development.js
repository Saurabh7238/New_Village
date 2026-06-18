import mongoose from 'mongoose';

const DevelopmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Work title is required']
  },
  description: {
    type: String,
    default: ''
  },
  scheme: {
    type: String,
    required: [true, 'Scheme/Fund source is required'],
    enum: ['15th Finance Commission', 'MNREGA', 'Gram Nidhi', 'PMAY', 'Swachh Bharat', 'Jal Jeevan Mission', 'PM-KISAN', 'Other State Scheme', 'Central Scheme', 'Other']
  },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required'],
    match: [/^\d{4}-\d{4}$/, 'Please provide financial year in format YYYY-YYYY']
  },
  sanctionedAmount: {
    type: Number,
    required: [true, 'Sanctioned amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  amountSpent: {
    type: Number,
    default: 0,
    min: [0, 'Amount cannot be negative']
  },
  wardNo: {
    type: Number,
    required: [true, 'Ward number is required']
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['Sanctioned', 'Ongoing', 'Completed', 'On Hold'],
    default: 'Sanctioned'
  },
  physicalProgress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  expectedCompletion: {
    type: Date,
    required: [true, 'Expected completion date is required']
  },
  actualCompletion: {
    type: Date,
    default: null
  },
  implementingAgency: {
    type: String,
    required: [true, 'Implementing agency is required']
  },
  beneficiaryCount: {
    type: String,
    default: ''
  },
  beforePhoto: {
    type: String,
    default: null
  },
  afterPhoto: {
    type: String,
    default: null
  },
  workOrderPDF: {
    data: { type: String, default: null },
    name: { type: String, default: null },
    mimeType: { type: String, default: 'application/pdf' }
  },
  socialAuditReport: {
    data: { type: String, default: null },
    name: { type: String, default: null },
    mimeType: { type: String, default: 'application/pdf' }
  },
  lastUpdatedOn: {
    type: Date,
    default: Date.now
  },
  displayOrder: {
    type: Number,
    default: 999
  }
}, {
  timestamps: true
});

// Update lastUpdatedOn before saving
DevelopmentSchema.pre('save', function(next) {
  this.lastUpdatedOn = new Date();
  next();
});

const Development = mongoose.models.Development || mongoose.model('Development', DevelopmentSchema);

export default Development;
