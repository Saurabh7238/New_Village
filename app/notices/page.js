'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, BellRing, CalendarDays, ChevronLeft, ChevronRight, Megaphone, Search } from 'lucide-react';
import {
  NOTIFICATION_CATEGORIES,
  SUBSCRIBABLE_NOTICE_CATEGORIES,
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
  const { data: session, status: sessionStatus } = useSession();
  const [notices, setNotices] = useState([]);
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState({
    categories: [],
    inAppEnabled: true,
    emailEnabled: false,
    applicationEmailEnabled: false,
    appointmentEmailEnabled: false,
    grievanceEmailEnabled: false,
  });
  const [subscriptionEmail, setSubscriptionEmail] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    let active = true;

    const loadSubscription = async () => {
      setSubscriptionLoading(true);
      try {
        const response = await fetch('/api/notice-subscriptions', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load subscription settings.');
        }
        if (!active) return;
        setSubscription(data.subscription);
        setSubscriptionEmail(data.email || '');
        setEmailConfigured(Boolean(data.emailConfigured));
        setHasSubscription(
          data.subscription.categories.length > 0
          || data.subscription.applicationEmailEnabled
          || data.subscription.appointmentEmailEnabled
          || data.subscription.grievanceEmailEnabled
        );
      } catch (loadError) {
        console.error('Failed to load notice subscription settings:', loadError);
        if (active) setSubscriptionError(loadError.message || 'Unable to load subscription settings.');
      } finally {
        if (active) setSubscriptionLoading(false);
      }
    };

    loadSubscription();
    return () => {
      active = false;
    };
  }, [sessionStatus]);

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

  const toggleSubscriptionCategory = (value) => {
    setSubscription((current) => ({
      ...current,
      categories: current.categories.includes(value)
        ? current.categories.filter((categoryValue) => categoryValue !== value)
        : [...current.categories, value],
    }));
  };

  const saveSubscription = async (event) => {
    event.preventDefault();
    setSubscriptionSaving(true);
    setSubscriptionMessage('');
    setSubscriptionError('');

    try {
      const response = await fetch('/api/notice-subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to save subscription settings.');
      }
      setSubscription(data.subscription);
      setHasSubscription(
        data.subscription.categories.length > 0
        || data.subscription.applicationEmailEnabled
        || data.subscription.appointmentEmailEnabled
        || data.subscription.grievanceEmailEnabled
      );
      setSubscriptionMessage(data.message);
    } catch (saveError) {
      console.error('Failed to save notice subscription:', saveError);
      setSubscriptionError(saveError.message || 'Unable to save subscription settings.');
    } finally {
      setSubscriptionSaving(false);
    }
  };

  const unsubscribe = async () => {
    setSubscriptionSaving(true);
    setSubscriptionMessage('');
    setSubscriptionError('');
    try {
      const response = await fetch('/api/notice-subscriptions', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to stop notice updates.');
      }
      setSubscription((current) => ({
        categories: [],
        inAppEnabled: false,
        emailEnabled: false,
        applicationEmailEnabled: current.applicationEmailEnabled,
        appointmentEmailEnabled: current.appointmentEmailEnabled,
        grievanceEmailEnabled: current.grievanceEmailEnabled,
      }));
      setHasSubscription(false);
      setSubscriptionMessage('You are unsubscribed from notice updates.');
    } catch (unsubscribeError) {
      console.error('Failed to unsubscribe from notice updates:', unsubscribeError);
      setSubscriptionError(unsubscribeError.message || 'Unable to stop notice updates.');
    } finally {
      setSubscriptionSaving(false);
    }
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

        <section aria-labelledby="notice-subscription-heading" className="mb-6 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:border-teal-900 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-teal-100 p-2.5 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="notice-subscription-heading" className="text-lg font-bold">Notification preferences</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Choose notice categories and email alerts for your service requests.
              </p>
            </div>
          </div>

          {sessionStatus === 'loading' || subscriptionLoading ? (
            <p role="status" className="mt-4 text-sm text-slate-500">Loading your subscription settings...</p>
          ) : sessionStatus !== 'authenticated' ? (
            <div className="mt-4">
              <Link href="/signin?callbackUrl=%2Fnotices" className="inline-flex min-h-10 items-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                Sign in to subscribe
              </Link>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Subscriptions are saved to your citizen account.</p>
            </div>
          ) : (
            <form onSubmit={saveSubscription} className="mt-5 space-y-5">
              <fieldset>
                <legend className="text-sm font-semibold">Choose the updates you want</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SUBSCRIBABLE_NOTICE_CATEGORIES.map((item) => (
                    <label key={item} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={subscription.categories.includes(item)}
                        onChange={() => toggleSubscriptionCategory(item)}
                        className="h-4 w-4 accent-teal-700"
                      />
                      <span>{CATEGORY_LABELS[item]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold">How should we notify you?</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="flex min-h-11 items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={subscription.inAppEnabled}
                      onChange={(event) => setSubscription((current) => ({ ...current, inAppEnabled: event.target.checked }))}
                      className="mt-0.5 h-4 w-4 accent-teal-700"
                    />
                    <span><strong>In-app updates</strong><span className="block text-xs text-slate-500 dark:text-slate-400">Available in My Updates after sign-in</span></span>
                  </label>
                  <label className={`flex min-h-11 items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 ${!emailConfigured || !subscriptionEmail ? 'opacity-60' : ''}`}>
                    <input
                      type="checkbox"
                      checked={subscription.emailEnabled}
                      disabled={!emailConfigured || !subscriptionEmail}
                      onChange={(event) => setSubscription((current) => ({ ...current, emailEnabled: event.target.checked }))}
                      className="mt-0.5 h-4 w-4 accent-teal-700"
                    />
                    <span>
                      <strong>Email updates</strong>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {subscriptionEmail || 'Add an email address to your account'}
                      </span>
                    </span>
                  </label>
                </div>
                {!emailConfigured && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    Email updates are not configured yet. In-app updates are available now.
                  </p>
                )}
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold">Email me when my request changes</legend>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  These are separate from public notice subscriptions. In-app service updates remain available in My Updates.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    ['applicationEmailEnabled', 'Applications'],
                    ['appointmentEmailEnabled', 'Appointments'],
                    ['grievanceEmailEnabled', 'Grievances'],
                  ].map(([field, label]) => (
                    <label key={field} className={`flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 ${!emailConfigured || !subscriptionEmail ? 'opacity-60' : ''}`}>
                      <input
                        type="checkbox"
                        checked={subscription[field]}
                        disabled={!emailConfigured || !subscriptionEmail}
                        onChange={(event) => setSubscription((current) => ({ ...current, [field]: event.target.checked }))}
                        className="h-4 w-4 accent-teal-700"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {subscriptionError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{subscriptionError}</p>}
              {subscriptionMessage && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{subscriptionMessage}</p>}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={subscriptionSaving || (
                    subscription.categories.length === 0
                    && !subscription.applicationEmailEnabled
                    && !subscription.appointmentEmailEnabled
                    && !subscription.grievanceEmailEnabled
                  ) || (
                    subscription.categories.length > 0
                    && !subscription.inAppEnabled
                    && !subscription.emailEnabled
                    && !subscription.applicationEmailEnabled
                    && !subscription.appointmentEmailEnabled
                    && !subscription.grievanceEmailEnabled
                  )}
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {subscriptionSaving ? 'Saving...' : hasSubscription ? 'Update subscription' : 'Subscribe to updates'}
                </button>
                {hasSubscription && (
                  <button
                    type="button"
                    onClick={unsubscribe}
                    disabled={subscriptionSaving}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Unsubscribe
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

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
