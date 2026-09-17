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
  workCode: {
    type: String,
    default: ''
  },
  workType: {
    type: String,
    default: 'Community Works'
  },
  activityType: {
    type: String,
    default: 'New/Fresh'
  },
  component: {
    type: String,
    default: 'Development'
  },
  scheme: {
    type: String,
    required: [true, 'Scheme/Fund source is required'],
    enum: ['15th Finance Commission', 'MNREGA', 'Gram Nidhi', 'PMAY', 'Swachh Bharat', 'Jal Jeevan Mission', 'PM-KISAN', '4th State Finance Commission', '5th State Finance Commission', 'Fourteen Finance Commission', 'XV Finance Commission', 'Own Funds', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 'Other State Scheme', 'Central Scheme', 'Other']
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
  expectedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Expected amount cannot be negative']
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
    enum: ['Sanctioned', 'Ongoing', 'Completed', 'On Hold', 'Acquisition', 'Abandoned', 'Under Approval'],
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
  registeredOn: {
    type: Date,
    default: null
  },
  sanctionedDate: {
    type: Date,
    default: null
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
  focusedArea: {
    type: String,
    default: ''
  },
  assetType: {
    type: String,
    default: ''
  },
  assetCategory: {
    type: String,
    default: ''
  },
  assetSubCategory: {
    type: String,
    default: ''
  },
  totalUnits: {
    type: Number,
    default: 0,
    min: [0, 'Total units cannot be negative']
  },
  unitCost: {
    type: Number,
    default: 0,
    min: [0, 'Unit cost cannot be negative']
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
