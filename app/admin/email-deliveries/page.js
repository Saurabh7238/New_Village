'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const STATUS_OPTIONS = ['all', 'sent', 'failed', 'skipped'];
const CATEGORY_LABELS = {
  notice: 'Notice',
  application: 'Application',
  appointment: 'Appointment',
  grievance: 'Grievance',
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-IN') : '—';
}

export default function AdminEmailDeliveriesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [deliveries, setDeliveries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const response = await fetch(`/api/admin/email-deliveries?${params}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load delivery history.');
      setDeliveries(data.deliveries || []);
      setPagination(data.pagination || { pages: 1 });
    } catch (loadError) {
      console.error('Email delivery history load failed:', loadError);
      setError(loadError.message || 'Unable to load delivery history.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') loadDeliveries();
  }, [loadDeliveries, session?.user?.role, sessionStatus]);

  const retryDelivery = async (id) => {
    setBusyId(id);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/email-deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to retry this email.');
      setMessage(data.message);
      await loadDeliveries();
    } catch (retryError) {
      console.error('Email delivery retry failed:', retryError);
      setError(retryError.message || 'Unable to retry this email.');
    } finally {
      setBusyId('');
    }
  };

  if (sessionStatus === 'loading') return <p className="p-8 text-center">Loading...</p>;
  if (sessionStatus !== 'authenticated' || session?.user?.role !== 'admin') {
    return <p className="p-8 text-center text-red-600">Admin access required.</p>;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-slate-900 dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Admin tools</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Email delivery history</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review email outcomes and retry failed deliveries.</p>
        </div>
        <Link href="/admin/notifications" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
          Back to notices
        </Link>
      </header>

      {error && <p role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{message}</p>}

      <label className="block max-w-xs text-sm font-semibold">
        Filter by delivery status
        <select
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option === 'all' ? 'All statuses' : option}</option>)}
        </select>
      </label>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-3">Updated</th>
              <th className="p-3">Type</th>
              <th className="p-3">Recipient</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              <th className="p-3">Attempts / details</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center">Loading delivery history...</td></tr>
            ) : deliveries.map((delivery) => (
              <tr key={delivery.id} className="border-t align-top dark:border-slate-700">
                <td className="whitespace-nowrap p-3">{formatDate(delivery.updatedAt)}</td>
                <td className="p-3">{CATEGORY_LABELS[delivery.category] || delivery.category}</td>
                <td className="p-3">{delivery.recipientEmailMasked || 'No email'}</td>
                <td className="max-w-xs break-words p-3">{delivery.subject}</td>
                <td className="p-3 font-semibold capitalize">{delivery.status}</td>
                <td className="max-w-sm break-words p-3">
                  <p>{delivery.attempts} attempt(s)</p>
                  {delivery.lastError && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{delivery.lastError}</p>}
                </td>
                <td className="p-3">
                  {delivery.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => retryDelivery(delivery.id)}
                      disabled={Boolean(busyId)}
                      className="rounded bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                    >
                      {busyId === delivery.id ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && deliveries.length === 0 && <p className="p-8 text-center text-slate-500">No email deliveries found.</p>}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded border px-3 py-2 disabled:opacity-50">Previous</button>
          <span>Page {page} of {pagination.pages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} disabled={page >= pagination.pages} className="rounded border px-3 py-2 disabled:opacity-50">Next</button>
        </div>
      )}
    </main>
  );
}
