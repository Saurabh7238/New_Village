import mongoose from 'mongoose';

const SlideSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    alt: { type: String, default: '' },
    href: { type: String, default: '' },
  },
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
