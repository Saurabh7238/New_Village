import mongoose from 'mongoose';
import { DEFAULT_VILLAGE_PROFILE } from '@/lib/villageProfile';

const SlideSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    alt: { type: String, default: '' },
    href: { type: String, default: '' },
  },
  { _id: false }
);

const VillageProfileSchema = new mongoose.Schema(
  Object.fromEntries(
    Object.entries(DEFAULT_VILLAGE_PROFILE).map(([field, value]) => [
      field,
      { type: String, default: value, trim: true, maxlength: 500 },
    ])
  ),
  { _id: false }
);

const HomeSettingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'default',
      unique: true,
      index: true,
    },
    villageName: {
      type: String,
      default: 'Chiutahara',
      trim: true,
      maxlength: 80,
    },
    villageNameHindi: {
      type: String,
      default: 'चिउटहरा',
      trim: true,
      maxlength: 80,
    },
    villageProfile: {
      type: VillageProfileSchema,
      default: () => ({}),
    },
    sloganEnabled: {
      type: Boolean,
      default: true,
    },
    slogan: {
      type: String,
      default: 'Panchayat Vikas, Sarvajan Sukhaya 🌞 | Efficient Governance for Every Citizen',
      trim: true,
      maxlength: 240,
    },
    sloganHindi: {
      type: String,
      default: 'पंचायत विकास, सर्वजन सुखाय 🌞 | Efficient Governance For Every Citizen',
      trim: true,
      maxlength: 240,
    },
    popupEnabled: {
      type: Boolean,
      default: true,
    },
    popupTitle: {
      type: String,
      default: 'Important Update',
    },
    popupMessage: {
      type: String,
      default: 'Gram Sabha will be held on the scheduled date at the Panchayat Bhavan.',
    },
    popupLink: {
      type: String,
      default: '',
    },
    galleryProtectionEnabled: {
      type: Boolean,
      default: false,
    },
    noticeEmailNotificationsEnabled: { type: Boolean, default: true },
    applicationEmailNotificationsEnabled: { type: Boolean, default: true },
    appointmentEmailNotificationsEnabled: { type: Boolean, default: true },
    grievanceEmailNotificationsEnabled: { type: Boolean, default: true },
    slides: {
      type: [SlideSchema],
      default: [
        {
          title: 'Village Services',
          imageUrl: '/slide.png',
          alt: 'Village services banner',
          href: '/grievance',
        },
        {
          title: 'Voter Services',
          imageUrl: '/voter.png',
          alt: 'Voter list banner',
          href: '/voter',
        },
        {
          title: 'Panchayat Campus',
          imageUrl: '/panchayat.jpg',
          alt: 'Panchayat campus banner',
          href: '/about',
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.models.HomeSettings || mongoose.model('HomeSettings', HomeSettingsSchema);
