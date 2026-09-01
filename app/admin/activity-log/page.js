'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = action ? `?action=${encodeURIComponent(action)}` : '';
    const response = await fetch(`/api/admin/activity-log${params}`);
    const data = response.ok ? await response.json() : { logs: [] };
    setLogs(data.logs || []);
    setLoading(false);
  }, [action]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-green-700 dark:text-green-300">Admin Panel</p><h1 className="text-3xl font-bold">Activity Log</h1></div>
          <Link href="/admin" className="rounded bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">Admin Panel</Link>
        </div>
        <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Filter by action" className="mb-5 w-full max-w-sm rounded border bg-white p-2 dark:border-gray-600 dark:bg-gray-800" />
        <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-3">Time</th><th className="p-3">Action</th><th className="p-3">Administrator</th><th className="p-3">Details</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="p-8 text-center">Loading...</td></tr> : logs.map((log) => <tr key={log.id} className="border-t dark:border-gray-700"><td className="p-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('en-IN')}</td><td className="p-3 font-semibold">{log.action}</td><td className="p-3 font-mono text-xs">{log.uniqueId}</td><td className="p-3 text-xs">{Object.entries(log.details || {}).map(([key, value]) => `${key}: ${value}`).join(' | ')}</td></tr>)}</tbody></table>
          {!loading && logs.length === 0 && <p className="p-8 text-center text-gray-500">No activity recorded.</p>}
        </div>
      </div>
    </main>
  );
}
