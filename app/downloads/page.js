import Link from 'next/link';

const services = [
  {
    category: 'Certificates / प्रमाण पत्र',
    name: 'Birth certificate application',
    hindi: 'जन्म प्रमाण पत्र आवेदन',
    description: 'Apply online and provide proof of birth, such as a hospital record.',
    hindiDescription: 'ऑनलाइन आवेदन करें और जन्म का प्रमाण, जैसे अस्पताल का रिकॉर्ड, दें।',
    href: '/birth',
    action: 'Apply online / ऑनलाइन आवेदन करें',
  },
  {
    category: 'Certificates / प्रमाण पत्र',
    name: 'Death certificate application',
    hindi: 'मृत्यु प्रमाण पत्र आवेदन',
    description: 'Apply online and provide a medical death certificate or other proof of death.',
    hindiDescription: 'ऑनलाइन आवेदन करें और चिकित्सा मृत्यु प्रमाण पत्र या मृत्यु का अन्य प्रमाण दें।',
    href: '/death',
    action: 'Apply online / ऑनलाइन आवेदन करें',
  },
  {
    category: 'Public services / जन सेवाएँ',
    name: 'Grievance application',
    hindi: 'शिकायत आवेदन',
    description: 'Submit a grievance online and follow its status through the portal.',
    hindiDescription: 'ऑनलाइन शिकायत दर्ज करें और पोर्टल पर उसकी स्थिति देखें।',
    href: '/grievance',
    action: 'Submit a grievance / शिकायत दर्ज करें',
  },
];

export default function DownloadsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-white">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">
          Forms & services / फॉर्म और सेवाएँ
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-sky-700 dark:text-sky-200">
          Forms and Downloads / फॉर्म और डाउनलोड
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
          Apply for these services online. Blank, official PDF forms are not currently available here.
          If you need a printed form, please ask at the Gram Panchayat office.
        </p>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
          इन सेवाओं के लिए ऑनलाइन आवेदन करें। अभी यहाँ खाली आधिकारिक PDF फॉर्म उपलब्ध नहीं हैं।
          मुद्रित फॉर्म के लिए ग्राम पंचायत कार्यालय से संपर्क करें।
        </p>
      </header>

      <section aria-labelledby="online-services-heading">
        <h2 id="online-services-heading" className="mb-4 text-xl font-bold">
          Online applications / ऑनलाइन आवेदन
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.href}
              className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                {service.category}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{service.name}</h3>
              <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">{service.hindi}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{service.description}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{service.hindiDescription}</p>
              <Link
                href={service.href}
                className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                {service.action}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="voter-correction-heading"
        className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30"
      >
        <h2 id="voter-correction-heading" className="text-lg font-bold">
          Voter record correction / मतदाता विवरण में सुधार
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          A verified voter-correction form is not available for download here. Check your voter listing
          in the portal or contact the Gram Panchayat office for guidance on the official correction process.
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
          यहाँ सत्यापित मतदाता-सुधार फॉर्म डाउनलोड के लिए उपलब्ध नहीं है। पोर्टल पर मतदाता सूची देखें
          या आधिकारिक सुधार प्रक्रिया की जानकारी के लिए ग्राम पंचायत कार्यालय से संपर्क करें।
        </p>
        <Link
          href="/voter"
          className="mt-4 inline-flex rounded-lg border border-amber-700 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:border-amber-300 dark:text-amber-100 dark:hover:bg-amber-900/40"
        >
          Search voter list / मतदाता सूची देखें
        </Link>
      </section>
    </main>
  );
}
