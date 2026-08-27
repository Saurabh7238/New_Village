"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

const services = [
  ['aadhaar-request', 'Aadhaar Update'],
  ['birth-certificate', 'Birth Certificate'],
  ['death-certificate', 'Death Certificate'],
  ['voter-request', 'Voter Service'],
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [byService, setByService] = useState({});
  useEffect(() => { fetch('/api/me').then((r) => r.ok ? r.json() : null).then((data) => setUser(data?.user || null)); }, []);
  useEffect(() => {
    const load = () => fetch('/api/service-notifications').then((r) => r.ok ? r.json() : null).then((data) => setByService(data?.byService || {})).catch(() => setByService({}));
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return <div className="mx-auto max-w-6xl py-4">
    <section className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-5 shadow-sm dark:border-green-800 dark:from-gray-800 dark:to-gray-900">
      <p className="text-sm font-semibold text-green-700 dark:text-green-300">Citizen Dashboard</p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name || 'Citizen'}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Access your Panchayat services and personal information in one place.</p>
      <div className="mt-4 flex flex-wrap gap-3"><Link href="/grievance" className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">Raise New Query</Link><Link href="/dashboard/profile" className="rounded-md border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 dark:text-green-300">My Profile</Link></div>
    </section>
    <section className="mt-5"><h2 className="mb-3 text-lg font-bold">Service updates</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map(([serviceType, title]) => { const count = byService[serviceType] || 0; return <Link key={serviceType} href={`/dashboard/applications?service=${serviceType}`} className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-green-500 dark:border-gray-700 dark:bg-gray-800"><p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p><p className="mt-2 text-sm font-semibold text-green-700 dark:text-green-300">View request status</p>{count > 0 && <span className="absolute right-3 top-3 grid min-w-6 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white" aria-label={`${count} unread updates`}>{count}</span>}</Link>; })}</div><div className="mt-4 flex flex-wrap gap-3"><Link href="/track" className="rounded border border-green-700 px-4 py-2 text-sm font-semibold text-green-700">My Queries</Link><Link href="/appointments" className="rounded border border-green-700 px-4 py-2 text-sm font-semibold text-green-700">My Appointments</Link></div></section>
  </div>;
}
