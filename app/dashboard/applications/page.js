"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function MyApplicationsContent() {
  const [applications, setApplications] = useState([]);
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const service = searchParams.get('service');
  const highlightedId = searchParams.get('application');
  useEffect(() => { fetch('/api/applications').then((response) => response.ok ? response.json() : { applications: [] }).then((data) => setApplications(data.applications || [])).finally(() => setLoading(false)); }, []);
  useEffect(() => { fetch('/api/service-notifications').then((response) => response.ok ? response.json() : null).then((data) => setUpdates(Object.fromEntries((data?.notifications || []).map((note) => [note.relatedId, note])))); }, []);
  const openUpdate = async (application) => { const notification = updates[application.id]; if (notification) { await fetch('/api/service-notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: notification.id }) }); setUpdates((current) => { const next = { ...current }; delete next[application.id]; return next; }); } };
  const visibleApplications = service ? applications.filter((application) => application.serviceType === service) : applications;
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900"><div className="mx-auto max-w-4xl"><h1 className="mb-6 text-3xl font-bold text-green-700 dark:text-yellow-400">My Service Applications</h1>{loading ? <p>Loading applications...</p> : visibleApplications.length === 0 ? <p>No service applications yet.</p> : <div className="space-y-3">{visibleApplications.map((application) => <article key={application.id} className={`rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${highlightedId === application.id ? 'ring-2 ring-red-500' : ''}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-green-700">{application.applicationNumber}</p><p className="capitalize">{application.serviceType.replace(/-/g, ' ')}</p></div><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-100">{application.status}</span></div><p className="mt-2 text-sm text-gray-500">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>{updates[application.id] && <button onClick={() => openUpdate(application)} className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">View new update</button>}{application.adminRemarks && <p className="mt-3 border-t pt-3 text-sm"><strong>Admin update:</strong> {application.adminRemarks}</p>}</article>)}</div>}</div></main>;
}

export default function MyApplicationsPage() {
  return <Suspense fallback={<div className="p-8 text-center">Loading applications...</div>}><MyApplicationsContent /></Suspense>;
}
