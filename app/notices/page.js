'use client';

const notices = [
  {
    title: 'Village cleanliness drive',
    hindi: 'गांव स्वच्छता अभियान',
    text: 'A cleanliness drive will be organized on Saturday morning across the village roads and public spaces.',
    date: '04 Sep 2026',
  },
  {
    title: 'Gram Sabha meeting',
    hindi: 'ग्राम सभा बैठक',
    text: 'All residents are requested to attend the upcoming Gram Sabha meeting for local development planning.',
    date: '12 Sep 2026',
  },
  {
    title: 'Festival alert',
    hindi: 'त्योहार सूचना',
    text: 'Public holiday and local arrangements have been announced for the upcoming festival celebration.',
    date: '20 Sep 2026',
  },
];

export default function NoticesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-white">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Public Notice</p>
        <h1 className="mt-2 text-3xl font-extrabold text-emerald-800 dark:text-emerald-200">Public Notices / सार्वजनिक सूचना</h1>
      </div>

      <div className="grid gap-4">
        {notices.map((notice) => (
          <article key={notice.title} className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{notice.title}</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">{notice.date}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{notice.hindi}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{notice.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
