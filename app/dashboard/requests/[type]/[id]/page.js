'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function requestReference(request) {
  return request.type === 'application'
    ? request.applicationNumber
    : request.type === 'appointment'
      ? request.appointmentNumber
      : request.queryId;
}

function historyItems(request) {
  const entries = request.statusHistory?.length
    ? request.statusHistory
    : request.auditLog?.length
      ? request.auditLog.map((entry) => ({
        status: entry.to || entry.action,
        remarks: entry.action,
        changedBy: entry.changedBy,
        changedAt: entry.changedAt,
      }))
      : [{ status: request.status, remarks: request.adminRemarks, changedAt: request.createdAt }];
  return entries.filter((entry) => entry?.status);
}

export default function CitizenRequestDetailsPage() {
  const { type, id } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/my-requests/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load this request.');
        return data.request;
      })
      .then((data) => { if (active) setRequest(data); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, type]);

  if (loading) return <main className="mx-auto max-w-3xl p-6 text-center" role="status">Loading request details...</main>;
  if (error || !request) {
    return <main className="mx-auto max-w-3xl p-6">
      <p role="alert" className="rounded-lg bg-red-100 p-4 text-red-800">{error || 'Request not found.'}</p>
      <Link href="/dashboard" className="mt-4 inline-block font-semibold text-teal-700 underline">Back to dashboard</Link>
    </main>;
  }

  const reference = requestReference(request);
  const documents = [
    ...(request.documents || []).map((document) => ({ ...document, group: 'Submitted documents' })),
    ...(request.adminDocuments || []).map((document) => ({ ...document, group: 'Panchayat documents' })),
    ...(request.attachments || []).map((document) => ({ ...document, group: 'Attachments' })),
    ...(request.resolutionPhoto ? [{ fileName: 'Resolution document', fileUrl: request.resolutionPhoto, group: 'Resolution' }] : []),
  ];

  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 text-slate-900 dark:text-white">
    <Link href="/dashboard" className="text-sm font-semibold text-teal-700 underline dark:text-teal-300">← Citizen dashboard</Link>
    <header className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-teal-700 dark:text-teal-300 capitalize">{request.type} request</p>
      <h1 className="mt-1 break-all text-2xl font-bold">{reference}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {request.serviceType?.replace(/-/g, ' ') || request.service || request.category}
        {request.subject ? ` · ${request.subject}` : ''}
      </p>
      <p className="mt-3 inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-900 dark:bg-teal-950 dark:text-teal-100">{request.status}</p>
    </header>

    <section className="rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-bold">Request details</h2>
      {request.description && <p className="mt-3 whitespace-pre-wrap text-sm">{request.description}</p>}
      {request.purpose && <p className="mt-3 whitespace-pre-wrap text-sm">{request.purpose}</p>}
      {request.adminRemarks && <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm dark:bg-teal-950/40"><strong>Latest Panchayat response:</strong> {request.adminRemarks}</p>}
      {request.requestedDocuments?.length > 0 && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"><strong>Documents requested:</strong> {request.requestedDocuments.join(', ')}</div>}
      {request.appointmentDate && <p className="mt-3 text-sm">Appointment: {new Date(request.scheduledDate || request.appointmentDate).toLocaleDateString('en-IN')} · {request.scheduledTime || request.appointmentTime}</p>}
      {request.formData && Object.keys(request.formData).length > 0 && <details className="mt-4">
        <summary className="cursor-pointer font-semibold">Submitted form information</summary>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(request.formData).filter(([key]) => key !== 'applicant').map(([key, value]) => (
            <div key={key} className="rounded bg-slate-50 p-2 text-sm dark:bg-slate-800">
              <dt className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
              <dd className="break-words">{typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '—')}</dd>
            </div>
          ))}
        </dl>
      </details>}
    </section>

    <section className="rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-bold">Status history</h2>
      <ol className="mt-3 space-y-3">
        {historyItems(request).map((entry, index) => (
          <li key={`${entry.status}-${entry.changedAt || index}`} className="border-l-2 border-teal-600 pl-3">
            <p className="font-semibold">{entry.status}</p>
            {entry.remarks && <p className="text-sm text-slate-600 dark:text-slate-300">{entry.remarks}</p>}
            {entry.changedAt && <time className="text-xs text-slate-500" dateTime={new Date(entry.changedAt).toISOString()}>{new Date(entry.changedAt).toLocaleString('en-IN')}</time>}
          </li>
        ))}
      </ol>
    </section>

    {documents.length > 0 && <section className="rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-bold">Documents</h2>
      <ul className="mt-3 space-y-2">
        {documents.map((document, index) => <li key={`${document.group}-${document.fileName}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm dark:border-slate-700">
          <span><span className="font-semibold">{document.fileName || `Document ${index + 1}`}</span><span className="ml-2 text-xs text-slate-500">{document.group}</span></span>
          {document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 underline dark:text-teal-300">Open</a>}
        </li>)}
      </ul>
    </section>}
  </main>;
}
