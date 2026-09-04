'use client';

const faqs = [
  {
    question: 'How do I apply for a birth certificate?',
    hindi: 'जन्म प्रमाण पत्र के लिए आवेदन कैसे करें?',
    answer: 'Go to the Birth Certificates section, fill in the required form, and submit the necessary documents for verification.',
  },
  {
    question: 'How can I track my complaint status?',
    hindi: 'मैं अपनी शिकायत की स्थिति कैसे ट्रैक कर सकता हूँ?',
    answer: 'Use the Track Query page and enter your Query ID to view the latest progress and updates.',
  },
  {
    question: 'What documents are needed for a grievance?',
    hindi: 'शिकायत के लिए कौन-कौन से दस्तावेज चाहिए?',
    answer: 'Your full address, complaint details, related photo if needed, and any supporting documents should be uploaded or submitted.',
  },
  {
    question: 'Can I ask for help through WhatsApp?',
    hindi: 'क्या मैं व्हाट्सऐप से सहायता ले सकता हूँ?',
    answer: 'Yes, you can use the WhatsApp Help option from the homepage to quickly contact the Panchayat team.',
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-white">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">FAQ</p>
        <h1 className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-200">Frequently Asked Questions / अक्सर पूछे जाने वाले प्रश्न</h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={faq.question} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Q{index + 1}</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{faq.question}</h2>
            <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">{faq.hindi}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
