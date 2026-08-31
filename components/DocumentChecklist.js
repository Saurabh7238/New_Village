"use client";

const translations = {
  "Birth proof / hospital record": "जन्म प्रमाण / अस्पताल का रिकॉर्ड",
  "Medical death certificate or other death proof": "चिकित्सकीय मृत्यु प्रमाणपत्र या अन्य मृत्यु प्रमाण",
  "Identity or address proof": "पहचान या पते का प्रमाण",
};

export default function DocumentChecklist({ documents = [] }) {
  if (!documents.length) return null;

  return (
    <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-slate-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-slate-100" aria-labelledby="document-checklist-title">
      <h2 id="document-checklist-title" className="font-bold text-emerald-900 dark:text-emerald-200">Documents checklist / आवश्यक दस्तावेज़</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Keep clear PDF, JPG, or PNG copies ready before applying. / आवेदन से पहले साफ़ PDF, JPG या PNG प्रतियां तैयार रखें।</p>
      <ul className="mt-3 space-y-2 text-sm">
        {documents.map((document) => (
          <li key={document} className="flex gap-2"><span aria-hidden="true">☐</span><span><strong>{document}</strong><span className="block text-slate-600 dark:text-slate-300">{translations[document] || document}</span></span></li>
        ))}
      </ul>
    </section>
  );
}
