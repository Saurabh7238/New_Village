"use client";

import ServiceApplicationForm from '@/components/ServiceApplicationForm';
import { useLanguage } from '@/app/language-provider';

export default function BirthPage() {
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Birth Certificates',
      description: 'Apply with the child’s details. Contact details are prefilled and can be updated.',
      childName: 'Child Name',
      ageAuto: 'Child Age (Auto)',
      gender: 'Gender',
      dateOfBirth: 'Date of Birth',
      placeOfBirth: 'Place of Birth',
      motherName: 'Mother Name',
      fatherName: 'Father Name',
      additionalDetails: 'Additional Details',
    },
    hi: {
      title: 'जन्म प्रमाण पत्र',
      description: 'बच्चे की जानकारी के साथ आवेदन करें। संपर्क विवरण पहले से भरे हुए हैं और आवश्यकतानुसार अपडेट किया जा सकता है।',
      childName: 'बच्चे का नाम',
      ageAuto: 'बच्चे की आयु (स्वतः)',
      gender: 'लिंग',
      dateOfBirth: 'जन्म तिथि',
      placeOfBirth: 'जन्म स्थान',
      motherName: 'माता का नाम',
      fatherName: 'पिता का नाम',
      additionalDetails: 'अतिरिक्त विवरण',
    },
  };

  const t = labels[language] || labels.en;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mx-auto max-w-5xl px-4 pt-36">
      <h1 className="mb-2 text-3xl font-bold text-green-700">{t.title}</h1>
      <p className="mb-6 text-gray-700">{t.description}</p>
      <div className="rounded-lg bg-white p-6 shadow">
        <ServiceApplicationForm
          serviceType="birth-certificate"
          includeContactFields
          requiredDocuments={['Birth proof / hospital record']}
          fields={[
            { name: 'childName', label: t.childName, required: true },
            { name: 'dateOfBirth', label: t.dateOfBirth, type: 'date', required: true, max: today },
            { name: 'applicantAge', label: t.ageAuto, type: 'number', required: false, readOnly: true },
            { name: 'gender', label: t.gender, type: 'select', required: true, options: [{ value: 'male', label: language === 'hi' ? 'पुरुष' : 'Male' }, { value: 'female', label: language === 'hi' ? 'महिला' : 'Female' }, { value: 'other', label: language === 'hi' ? 'अन्य' : 'Other' }] },
            { name: 'placeOfBirth', label: t.placeOfBirth, required: true },
            { name: 'motherName', label: t.motherName, required: true },
            { name: 'fatherName', label: t.fatherName, required: false },
            { name: 'additionalDetails', label: t.additionalDetails, multiline: true, required: false },
          ]}
        />
      </div>
    </div>
  );
}
