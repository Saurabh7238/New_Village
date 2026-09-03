'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

function formatLogValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toLocaleString('en-IN');
    return JSON.stringify(value);
  }
  return String(value);
}

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [user, setUser] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (action) params.set('action', action);
    if (entityType) params.set('entityType', entityType);
    if (user) params.set('user', user);
    const response = await fetch(`/api/admin/activity-log?${params}`);
    const data = response.ok ? await response.json() : { logs: [] };
    setLogs(data.logs || []);
    setPagination(data.pagination || { pages: 1 });
    setLoading(false);
  }, [action, entityType, page, user]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">Admin Panel</p>
            <h1 className="text-3xl font-bold">Activity Log</h1>
          </div>
          <Link href="/admin" className="rounded bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">Admin Panel</Link>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <input value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} placeholder="Filter by action" className="rounded border bg-white p-2 dark:border-gray-600 dark:bg-gray-800" />
          <input value={user} onChange={(event) => { setUser(event.target.value); setPage(1); }} placeholder="Filter by user or unique ID" className="rounded border bg-white p-2 dark:border-gray-600 dark:bg-gray-800" />
          <input value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }} placeholder="Filter by entity type" className="rounded border bg-white p-2 dark:border-gray-600 dark:bg-gray-800" />
        </div>

        <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">Loading...</td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-t align-top dark:border-gray-700">
                  <td className="whitespace-nowrap p-3 text-xs">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-semibold">{log.userName || 'System'}</div>
                      <div className="font-mono text-[11px] text-gray-600 dark:text-gray-300">User ID: {log.userId || '—'}</div>
                      <div className="font-mono text-[11px] text-gray-600 dark:text-gray-300">Unique ID: {log.uniqueId || '—'}</div>
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{log.action}</td>
                  <td className="p-3 text-xs">
                    <div>{log.entityType || '—'}</div>
                    <div className="font-mono text-[11px] text-gray-600 dark:text-gray-300">{log.entityId || '—'}</div>
                  </td>
                  <td className="p-3 text-xs text-gray-700 dark:text-gray-200">
                    <div className="max-w-lg space-y-1">
                      {Object.entries(log.details || {}).map(([key, value]) => (
                        <div key={`${log.id}-${key}`} className="break-words">
                          <span className="font-semibold">{key}:</span> {formatLogValue(value)}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && logs.length === 0 && <p className="p-8 text-center text-gray-500">No activity recorded.</p>}
        </div>
        {pagination.pages > 1 && <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-3 text-sm shadow dark:bg-gray-800"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded border px-3 py-1 disabled:opacity-50">Previous</button><span>Page {page} of {pagination.pages}</span><button onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} disabled={page >= pagination.pages} className="rounded border px-3 py-1 disabled:opacity-50">Next</button></div>}
      </div>
    </main>
  );
}
