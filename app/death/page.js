"use client";

import ServiceApplicationForm from '@/components/ServiceApplicationForm';
import { useLanguage } from '@/app/language-provider';

export default function DeathPage() {
  const { language } = useLanguage();
  const today = new Date().toISOString().split('T')[0];

  const labels = {
    en: {
      title: 'Death Certificates',
      description: 'Apply with the deceased person’s details. Contact details are prefilled and can be updated.',
      applicantAge: 'Applicant Age',
      gender: 'Gender',
      deceasedName: 'Deceased Person Name',
      dateOfDeath: 'Date of Death',
      placeOfDeath: 'Place of Death',
      informantName: 'Informant Name',
      relationship: 'Relationship to Deceased',
      additionalDetails: 'Additional Details',
    },
    hi: {
      title: 'मृत्यु प्रमाण पत्र',
      description: 'मृत व्यक्ति की जानकारी के साथ आवेदन करें। संपर्क विवरण पहले से भरे हुए हैं और आवश्यकतानुसार अपडेट किया जा सकता है।',
      applicantAge: 'आवेदक की आयु',
      gender: 'लिंग',
      deceasedName: 'मृतक का नाम',
      dateOfDeath: 'मृत्यु की तिथि',
      placeOfDeath: 'मृत्यु स्थान',
      informantName: 'सूचना देने वाले का नाम',
      relationship: 'मृतक से संबंध',
      additionalDetails: 'अतिरिक्त विवरण',
    },
  };

  const t = labels[language] || labels.en;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-36">
      <h1 className="mb-2 text-3xl font-bold text-green-700">{t.title}</h1>
      <p className="mb-6 text-gray-700">{t.description}</p>
      <div className="rounded-lg bg-white p-6 shadow">
        <ServiceApplicationForm
          serviceType="death-certificate"
          includeContactFields
          requiredDocuments={['Medical death certificate or other death proof']}
          fields={[
            { name: 'applicantAge', label: t.applicantAge, type: 'number', required: true },
            { name: 'gender', label: t.gender, type: 'select', required: true, options: [{ value: 'male', label: language === 'hi' ? 'पुरुष' : 'Male' }, { value: 'female', label: language === 'hi' ? 'महिला' : 'Female' }, { value: 'other', label: language === 'hi' ? 'अन्य' : 'Other' }] },
            { name: 'deceasedName', label: t.deceasedName, required: true },
            { name: 'dateOfDeath', label: t.dateOfDeath, type: 'date', required: true, max: today },
            { name: 'placeOfDeath', label: t.placeOfDeath, required: true },
            { name: 'informantName', label: t.informantName, required: true },
            { name: 'relationship', label: t.relationship, required: true },
            { name: 'additionalDetails', label: t.additionalDetails, multiline: true, required: false },
          ]}
        />
      </div>
    </div>
  );
}
