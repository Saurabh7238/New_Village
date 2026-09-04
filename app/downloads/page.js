'use client';

const forms = [
  { name: 'Birth certificate form', hindi: 'जन्म प्रमाण पत्र फॉर्म', href: '#', type: 'PDF' },
  { name: 'Death certificate form', hindi: 'मृत्यु प्रमाण पत्र फॉर्म', href: '#', type: 'PDF' },
  { name: 'Grievance form', hindi: 'शिकायत फॉर्म', href: '#', type: 'DOC' },
  { name: 'Voter correction form', hindi: 'मतदाता सुधार फॉर्म', href: '#', type: 'PDF' },
];

export default function DownloadsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-white">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">Downloads</p>
        <h1 className="mt-2 text-3xl font-extrabold text-sky-700 dark:text-sky-200">Download Forms / फॉर्म डाउनलोड</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {forms.map((form) => (
          <div key={form.name} className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{form.name}</h2>
                <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">{form.hindi}</p>
              </div>
              <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">{form.type}</span>
            </div>
            <a
              href={form.href}
              className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700"
            >
              Download / डाउनलोड
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
