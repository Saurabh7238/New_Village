"use client";

import { useEffect, useState } from 'react';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/applications').then((response) => response.ok ? response.json() : { applications: [] }).then((data) => setApplications(data.applications || [])).finally(() => setLoading(false)); }, []);
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900"><div className="mx-auto max-w-4xl"><h1 className="mb-6 text-3xl font-bold text-green-700 dark:text-yellow-400">My Service Applications</h1>{loading ? <p>Loading applications...</p> : applications.length === 0 ? <p>No service applications yet.</p> : <div className="space-y-3">{applications.map((application) => <article key={application.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-green-700">{application.applicationNumber}</p><p className="capitalize">{application.serviceType.replace(/-/g, ' ')}</p></div><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-100">{application.status}</span></div><p className="mt-2 text-sm text-gray-500">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>{application.adminRemarks && <p className="mt-3 border-t pt-3 text-sm"><strong>Admin update:</strong> {application.adminRemarks}</p>}</article>)}</div>}</div></main>;
}
