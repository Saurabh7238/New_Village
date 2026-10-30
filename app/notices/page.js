'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Megaphone, Search } from 'lucide-react';
import {
  NOTIFICATION_CATEGORIES,
  CATEGORY_LABELS,
  getCategoryColor,
} from '@/lib/notificationConstants';

const ITEMS_PER_PAGE = 9;

function formatNoticeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchNotices = async (showLoading = false) => {
      if (showLoading && active) setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });
        if (category) params.set('category', category);
        if (search) params.set('search', search);

        const response = await fetch(`/api/notifications?${params.toString()}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.notifications)) {
          throw new Error(data.message || 'Unable to load the notice board.');
        }

        if (!active) return;
        setNotices(data.notifications);
        setTotalPages(data.pages || 0);
        setError('');
      } catch (fetchError) {
        console.error('Failed to load the community notice board:', fetchError);
        if (active) {
          setError('Notices could not be loaded right now. Please try again later.');
          setNotices([]);
        }
      } finally {
        if (showLoading && active) setLoading(false);
      }
    };

    fetchNotices(true);
    const refreshInterval = setInterval(() => fetchNotices(), 30000);

    return () => {
      active = false;
      clearInterval(refreshInterval);
    };
  }, [category, currentPage, search]);

  const handleCategoryChange = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-24 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl bg-gradient-to-br from-teal-800 to-emerald-600 px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
          <div className="flex items-start gap-4">
            <span className="rounded-xl bg-white/15 p-3">
              <Megaphone className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-100">Chiutahara community</p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Community Notice Board</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50 sm:text-base">
                Birthday wishes, greetings, congratulations, condolence messages, village events, and official updates.
              </p>
            </div>
          </div>
        </header>

        <section aria-label="Filter notices" className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 sm:p-5">
          <label className="block text-sm font-semibold">
            Notice category
            <select
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">All categories</option>
              {NOTIFICATION_CATEGORIES.map((item) => (
                <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>
              ))}
            </select>
          </label>

          <form onSubmit={handleSearch} className="block text-sm font-semibold">
            Search notices
            <div className="mt-2 flex gap-2">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search title or message"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-800"
              />
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-800">
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Search</span>
              </button>
            </div>
          </form>
        </section>

        {error && (
          <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <div role="status" className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Loading community notices…
          </div>
        ) : notices.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notices.map((notice) => {
                const date = formatNoticeDate(notice.issueDate || notice.createdAt);
                const noticeCategory = notice.category || 'announcement';

                return (
                  <article key={notice.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getCategoryColor(noticeCategory)}`}>
                        {CATEGORY_LABELS[noticeCategory] || CATEGORY_LABELS.announcement}
                      </span>
                      {date && (
                        <time dateTime={notice.issueDate || notice.createdAt} className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {date}
                        </time>
                      )}
                    </div>
                    <h2 className="text-xl font-bold leading-snug">{notice.title}</h2>
                    <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {notice.description}
                    </p>
                    <Link href={`/notifications/${notice.id}`} className="mt-5 inline-flex items-center gap-1 self-start text-sm font-bold text-teal-800 hover:underline dark:text-teal-300">
                      Read notice <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Notice pages" className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        ) : !error ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <Megaphone className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold">No notices to show</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Try another category or check back later for community updates.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
