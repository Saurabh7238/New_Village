'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

const COLLECTION_OPTIONS = [
  ['applications', 'Service applications'],
  ['appointments', 'Appointments'],
  ['grievances', 'Grievances'],
  ['notices', 'Public notices'],
];

export default function AdminDataBackupPage() {
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState(['applications', 'appointments', 'grievances', 'notices']);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const toggleCollection = (name) => {
    setSelected((current) => current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name]);
  };

  const downloadBackup = async () => {
    setBusy('download');
    setError('');
    setMessage('');
    try {
      const params = new URLSearchParams({ collections: selected.join(',') });
      const response = await fetch(`/api/admin/data-backup?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Unable to create the backup.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `chiutahara-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('Backup downloaded. Store it somewhere secure; it contains citizen information.');
    } catch (downloadError) {
      console.error('Operational backup download failed:', downloadError);
      setError(downloadError.message || 'Unable to create the backup.');
    } finally {
      setBusy('');
    }
  };

  const restoreBackup = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a backup JSON file first.');
      return;
    }
    if (!window.confirm('Merge records from this backup? Existing records will not be overwritten or deleted. Records with missing citizen accounts or conflicting IDs will be skipped.')) return;

    setBusy('restore');
    setError('');
    setMessage('');
    try {
      const content = await file.text();
      const response = await fetch('/api/admin/data-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: content,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to restore the backup.');
      const summary = Object.entries(data.results || {})
        .map(([name, counts]) => `${name}: ${counts.restored} restored, ${counts.skipped} skipped`)
        .join('; ');
      setMessage(`${data.message} ${summary}`);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (restoreError) {
      console.error('Operational backup restore failed:', restoreError);
      setError(restoreError.message || 'Unable to restore the backup.');
    } finally {
      setBusy('');
    }
  };

  if (status === 'loading') return <p className="p-8 text-center">Loading...</p>;
  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return <p className="p-8 text-center text-red-600">Admin access required.</p>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-slate-900 dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Admin tools</p>
          <h1 className="text-3xl font-bold">Data backup &amp; recovery</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Export selected operational records or safely merge them from a backup.</p>
        </div>
        <Link href="/admin" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
          Back to Admin
        </Link>
      </header>

      <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        Backups include citizen details and application form data. Uploaded documents, grievance photos/attachments, and private internal notes are excluded. Keep downloaded files private. Each collection is limited to 5,000 records and restore files to 10 MB.
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{message}</p>}

      <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Create a selected backup</h2>
        <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Select collections to back up</legend>
          {COLLECTION_OPTIONS.map(([name, label]) => (
            <label key={name} className="flex min-h-11 items-center gap-3 rounded-lg border p-3 text-sm dark:border-slate-700">
              <input type="checkbox" checked={selected.includes(name)} onChange={() => toggleCollection(name)} className="h-4 w-4 accent-teal-700" />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={downloadBackup}
          disabled={!selected.length || Boolean(busy)}
          className="mt-4 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy === 'download' ? 'Preparing backup...' : 'Download backup'}
        </button>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Merge a backup</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Restore only adds missing records; it never replaces or deletes existing records. It skips records whose citizen account is unavailable and records with validation or ID conflicts.
        </p>
        <form onSubmit={restoreBackup} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="min-w-0 flex-1 rounded-lg border p-2 text-sm dark:border-slate-700"
          />
          <button type="submit" disabled={!file || Boolean(busy)} className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50">
            {busy === 'restore' ? 'Merging backup...' : 'Merge backup'}
          </button>
        </form>
      </section>
    </main>
  );
}
