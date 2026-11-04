'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const services = [
  {
    category: 'Certificates',
    categoryLabel: 'Certificates / प्रमाण पत्र',
    name: 'Birth certificate application',
    hindi: 'जन्म प्रमाण पत्र आवेदन',
    description: 'Apply online and provide proof of birth, such as a hospital record.',
    hindiDescription: 'ऑनलाइन आवेदन करें और जन्म का प्रमाण, जैसे अस्पताल का रिकॉर्ड, दें।',
    requirements: [
      'Birth proof / hospital record',
      'जन्म प्रमाण / अस्पताल का रिकॉर्ड',
    ],
    href: '/birth',
    action: 'Apply online / ऑनलाइन आवेदन करें',
  },
  {
    category: 'Certificates',
    categoryLabel: 'Certificates / प्रमाण पत्र',
    name: 'Death certificate application',
    hindi: 'मृत्यु प्रमाण पत्र आवेदन',
    description: 'Apply online and provide a medical death certificate or other proof of death.',
    hindiDescription: 'ऑनलाइन आवेदन करें और चिकित्सा मृत्यु प्रमाण पत्र या मृत्यु का अन्य प्रमाण दें।',
    requirements: [
      'Medical death certificate or other death proof',
      'चिकित्सकीय मृत्यु प्रमाणपत्र या अन्य मृत्यु प्रमाण',
    ],
    href: '/death',
    action: 'Apply online / ऑनलाइन आवेदन करें',
  },
  {
    category: 'Public services',
    categoryLabel: 'Public services / जन सेवाएँ',
    name: 'Grievance application',
    hindi: 'शिकायत आवेदन',
    description: 'Submit a grievance online and follow its status through the portal.',
    hindiDescription: 'ऑनलाइन शिकायत दर्ज करें और पोर्टल पर उसकी स्थिति देखें।',
    requirements: [
      'No document is required to submit. A supporting photo is optional.',
      'शिकायत दर्ज करने के लिए दस्तावेज़ आवश्यक नहीं है। सहायक फोटो वैकल्पिक है।',
    ],
    href: '/grievance',
    action: 'Submit a grievance / शिकायत दर्ज करें',
  },
  {
    category: 'Voter services',
    categoryLabel: 'Voter services / मतदाता सेवाएँ',
    name: 'Voter record correction',
    hindi: 'मतदाता विवरण में सुधार',
    description: 'A verified correction form is not available here. Check your voter listing or contact the Gram Panchayat office for guidance.',
    hindiDescription: 'सत्यापित सुधार फॉर्म यहाँ उपलब्ध नहीं है। मतदाता सूची देखें या मार्गदर्शन के लिए ग्राम पंचायत कार्यालय से संपर्क करें।',
    requirements: [
      'This portal only provides voter-list search; ask the election office which proof is required for a correction.',
      'यह पोर्टल केवल मतदाता सूची खोजने की सुविधा देता है; सुधार के लिए आवश्यक प्रमाण चुनाव कार्यालय से पूछें।',
    ],
    href: '/voter',
    action: 'Search voter list / मतदाता सूची देखें',
  },
];

const categories = ['All categories', ...new Set(services.map((service) => service.category))];
const formCategories = {
  birth: 'Certificates',
  death: 'Certificates',
  grievance: 'Public services',
  voter: 'Voter services',
};
const languageLabels = {
  en: 'English',
  hi: 'Hindi / हिंदी',
  bilingual: 'Bilingual / द्विभाषी',
};

function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

export default function DownloadsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [forms, setForms] = useState([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [formsError, setFormsError] = useState('');

  const loadForms = useCallback(async () => {
    setFormsLoading(true);
    try {
      const response = await fetch('/api/public-forms', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load public forms.');
      setForms(data.forms || []);
      setFormsError('');
    } catch (error) {
      console.error('Public forms load failed:', error);
      setFormsError('Official downloadable forms could not be loaded. Please try again.');
    } finally {
      setFormsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return services.filter((service) => {
      const matchesCategory = category === 'All categories' || service.category === category;
      const searchableText = [
        service.categoryLabel,
        service.name,
        service.hindi,
        service.description,
        service.hindiDescription,
        ...service.requirements,
      ].join(' ').toLocaleLowerCase();
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [category, search]);

  const filteredForms = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return forms.filter((form) => {
      const matchesCategory = category === 'All categories' || formCategories[form.service] === category;
      const searchableText = [
        form.title,
        form.fileName,
        form.sourceNote,
        languageLabels[form.language],
        form.service,
      ].join(' ').toLocaleLowerCase();
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [category, forms, search]);

  const clearFilters = () => {
    setSearch('');
    setCategory('All categories');
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-base text-slate-900 dark:text-white">
      <header className="print-header mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-sky-700 dark:text-sky-300">
          Forms & services / फॉर्म और सेवाएँ
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-sky-700 dark:text-sky-200">
          Forms and Downloads / फॉर्म और डाउनलोड
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700 dark:text-slate-300">
          Use these links to apply online. Official PDFs appear below when an administrator publishes a verified copy.
          If you need a printed form, please ask at the Gram Panchayat office.
        </p>
        <p className="mt-1 max-w-3xl leading-7 text-slate-700 dark:text-slate-300">
          ऑनलाइन आवेदन के लिए नीचे दिए गए लिंक का उपयोग करें। व्यवस्थापक द्वारा सत्यापित PDF प्रकाशित करने पर वह नीचे दिखाई देगी।
          मुद्रित फॉर्म के लिए ग्राम पंचायत कार्यालय से संपर्क करें।
        </p>
      </header>

      <div className="no-print mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2">
        <div>
          <label htmlFor="service-search" className="mb-1 block font-semibold">
            Search forms and services / फॉर्म और सेवाएँ खोजें
          </label>
          <input
            id="service-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search in English or Hindi / अंग्रेज़ी या हिंदी में खोजें"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="service-category" className="mb-1 block font-semibold">
            Category / श्रेणी
          </label>
          <select
            id="service-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option === 'All categories'
                  ? 'All categories / सभी श्रेणियाँ'
                  : services.find((service) => service.category === option)?.categoryLabel}
              </option>
            ))}
          </select>
        </div>
        <p role="status" className="text-slate-700 dark:text-slate-300 sm:col-span-2" aria-live="polite">
          {filteredForms.length} downloadable {filteredForms.length === 1 ? 'form' : 'forms'} and{' '}
          {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found / फॉर्म और सेवाएँ मिलीं
        </p>
        {(search || category !== 'All categories') && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-11 justify-self-start rounded-lg border border-sky-700 px-4 py-2 font-semibold text-sky-800 hover:bg-sky-50 dark:border-sky-300 dark:text-sky-200 dark:hover:bg-slate-800"
          >
            Clear search and filters / खोज और फ़िल्टर हटाएँ
          </button>
        )}
      </div>

      <section aria-labelledby="official-forms-heading" className="mb-9">
        <h2 id="official-forms-heading" className="mb-3 text-xl font-bold">
          Official downloadable forms / आधिकारिक डाउनलोड फॉर्म
        </h2>
        {formsLoading ? (
          <p role="status" className="rounded-xl border border-slate-200 p-4 text-slate-700 dark:border-slate-700 dark:text-slate-300">
            Loading forms… / फॉर्म लोड हो रहे हैं…
          </p>
        ) : formsError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <p role="alert" className="text-slate-800 dark:text-slate-100">{formsError}</p>
            <button type="button" onClick={loadForms} className="mt-3 min-h-11 rounded-lg border border-red-700 px-4 py-2 font-semibold text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-950">
              Retry / पुनः प्रयास करें
            </button>
          </div>
        ) : filteredForms.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {filteredForms.map((form) => {
              const serviceLabel = services.find((service) => ({
                birth: service.href === '/birth',
                death: service.href === '/death',
                grievance: service.href === '/grievance',
                voter: service.href === '/voter',
              }[form.service]))?.categoryLabel;
              return (
                <li key={form.id} className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {serviceLabel || 'Panchayat form'} · {languageLabels[form.language] || form.language}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{form.title}</h3>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {form.fileName} · {formatBytes(form.fileSize)} · Updated {formatDate(form.updatedAt)}
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Approval reference: {form.sourceNote}</p>
                  <a
                    href={`/api/public-forms/${encodeURIComponent(form.id)}`}
                    className="no-print mt-3 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    Download PDF / PDF डाउनलोड करें
                  </a>
                </li>
              );
            })}
          </ul>
        ) : forms.length ? (
          <p role="status" className="rounded-xl border border-dashed border-slate-300 p-4 text-slate-700 dark:border-slate-600 dark:text-slate-300" aria-live="polite">
            No downloadable forms match your search or category.
            <br />
            आपकी खोज या श्रेणी से कोई डाउनलोड फॉर्म नहीं मिला।
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 leading-7 text-slate-700 dark:border-slate-600 dark:text-slate-300">
            No verified official PDFs are published yet. Please use the online service links below; do not rely on unofficial forms.
            <br />
            अभी कोई सत्यापित आधिकारिक PDF प्रकाशित नहीं है। नीचे दिए गए ऑनलाइन सेवा लिंक का उपयोग करें; गैर-आधिकारिक फॉर्म पर भरोसा न करें।
          </p>
        )}
      </section>

      <section aria-labelledby="online-services-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="online-services-heading" className="text-xl font-bold">
            Online applications / ऑनलाइन आवेदन
          </h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print min-h-11 rounded-lg border border-sky-700 px-4 py-2 font-bold text-sky-800 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-sky-300 dark:text-sky-200 dark:hover:bg-slate-800"
          >
            Print this page / पेज प्रिंट करें
          </button>
        </div>

        {filteredServices.length > 0 ? (
          <div className="print-grid grid gap-4 md:grid-cols-2">
            {filteredServices.map((service) => (
              <article
                key={service.href}
                className="break-inside-avoid rounded-2xl border border-sky-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                  {service.categoryLabel}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{service.name}</h3>
                <p className="mt-1 text-base text-sky-700 dark:text-sky-300">{service.hindi}</p>
                <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">{service.description}</p>
                <p className="mt-1 leading-7 text-slate-700 dark:text-slate-300">{service.hindiDescription}</p>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <h4 className="font-semibold">What to prepare / क्या तैयार रखें</h4>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-slate-700 dark:text-slate-300">
                    {service.requirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={service.href}
                  className="no-print mt-4 inline-flex min-h-11 items-center rounded-lg bg-sky-700 px-4 py-2 font-bold text-white hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  {service.action}
                </Link>
                <p className="hidden print:block mt-3 font-semibold">Portal path: {service.href}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
            <p role="status" className="leading-7 text-slate-700 dark:text-slate-300" aria-live="polite">
              No services match your search. Try another keyword or category.
              <br />
              आपकी खोज से कोई सेवा नहीं मिली। दूसरा शब्द या श्रेणी चुनें।
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="no-print mt-3 min-h-11 rounded-lg bg-sky-700 px-4 py-2 font-bold text-white hover:bg-sky-800"
            >
              Clear search and filters / खोज और फ़िल्टर हटाएँ
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
