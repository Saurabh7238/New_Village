"use client";

import ServiceApplicationForm from '@/components/ServiceApplicationForm';
import { useLanguage } from '@/app/language-provider';

export default function AadharPage() {
  const { language } = useLanguage();
  const today = new Date().toISOString().split('T')[0];

  const labels = {
    en: {
      title: 'Aadhaar Create / Update',
      description: 'Request assistance for Aadhaar services. Your number is never displayed in full.',
      applicantAge: 'Applicant Age',
      requestType: 'Request Type (new / update / correction)',
      preferredVisitDate: 'Preferred Visit Date',
      requestDetails: 'Request Details',
    },
    hi: {
      title: 'आधार बनाएं / अपडेट करें',
      description: 'आधार सेवाओं के लिए सहायता का अनुरोध करें। आपका मोबाइल नंबर पूर्ण रूप से सार्वजनिक नहीं किया जाता है।',
      applicantAge: 'आवेदक की आयु',
      requestType: 'अनुरोध का प्रकार (नया / अपडेट / सुधार)',
      preferredVisitDate: 'पसंदीदा विज़िट तिथि',
      requestDetails: 'अनुरोध का विवरण',
    },
  };

  const t = labels[language] || labels.en;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-36">
      <h1 className="mb-2 text-3xl font-bold text-green-700">{t.title}</h1>
      <p className="mb-6 text-gray-700">{t.description}</p>
      <div className="rounded-lg bg-white p-6 shadow">
        <ServiceApplicationForm
          serviceType="aadhaar-request"
          includeContactFields
          requiredDocuments={['Identity or address proof']}
          fields={[
            { name: 'applicantAge', label: t.applicantAge, type: 'number', required: true },
            { name: 'requestType', label: t.requestType, required: true },
            { name: 'preferredVisitDate', label: t.preferredVisitDate, type: 'date', required: false, max: today },
            { name: 'details', label: t.requestDetails, multiline: true, required: true },
          ]}
        />
      </div>
    </div>
  );
}
