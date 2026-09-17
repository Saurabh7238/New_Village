"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RequestStatusCard from '@/components/RequestStatusCard';
import EmptyState from '@/components/EmptyState';

const services = [
  ['aadhaar-request', 'Aadhaar Update'],
  ['birth-certificate', 'Birth Certificate'],
  ['death-certificate', 'Death Certificate'],
  ['voter-request', 'Voter Service'],
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [byService, setByService] = useState({});
  const [byRelatedType, setByRelatedType] = useState({});
  const [applications, setApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => { fetch('/api/me').then((r) => r.ok ? r.json() : null).then((data) => setUser(data?.user || null)); }, []);
  useEffect(() => {
    const load = () => fetch('/api/service-notifications').then((r) => r.ok ? r.json() : null).then((data) => { setByService(data?.byService || {}); setByRelatedType(data?.byRelatedType || {}); }).catch(() => { setByService({}); setByRelatedType({}); });
    load(); const interval = setInterval(load, 15000); return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    fetch('/api/applications').then((r) => r.ok ? r.json() : null).then((data) => setApplications(data?.applications || [])).catch(() => setApplications([]));
    fetch('/api/appointments').then((r) => r.ok ? r.json() : null).then((data) => setAppointments(data?.appointments || [])).catch(() => setAppointments([]));
  }, []);

  const serviceCards = [...services.map(([serviceType, title]) => ({ title, href: `/dashboard/applications?service=${serviceType}`, count: byService[serviceType] || 0 })), { title: 'My Queries', href: '/track', count: byRelatedType.query || 0 }, { title: 'My Appointments', href: '/appointments', count: byRelatedType.appointment || 0 }];
  const recentRequests = [...applications.slice(0, 4).map((item) => ({ item, type: 'application' })), ...appointments.slice(0, 2).map((item) => ({ item, type: 'appointment' }))];

  return <div className="mx-auto max-w-6xl py-4">
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Citizen Dashboard</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name || 'Citizen'}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Access your Panchayat services and personal information in one place.</p>
      <div className="mt-4 flex flex-wrap gap-2.5"><Link href="/grievance" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Raise New Query</Link><Link href="/dashboard/notifications" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 dark:border-slate-600 dark:text-slate-200">My Updates</Link><Link href="/dashboard/profile" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 dark:border-slate-600 dark:text-slate-200">My Profile</Link><Link href="/dashboard/documents" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 dark:border-slate-600 dark:text-slate-200">My Documents</Link></div>
    </section>
    <section className="mt-6"><h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Service updates</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{serviceCards.map(({ title, href, count }) => <Link key={title} href={href} className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p><p className="mt-2 text-sm font-semibold text-teal-700 dark:text-teal-300">View request status</p>{count > 0 && <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">Updated {count > 1 ? `(${count})` : ''}</span>}</Link>)}</div></section>
    <section className="mt-8"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold">Request timeline & receipts</h2><p className="text-sm text-slate-600 dark:text-slate-300">Track recent requests and download their receipts.</p></div><Link href="/dashboard/applications" className="text-sm font-bold text-teal-700 hover:underline dark:text-teal-300">View all applications</Link></div>{recentRequests.length ? <div className="grid gap-4 lg:grid-cols-2">{recentRequests.map(({ item, type }) => <RequestStatusCard key={`${type}-${item.id}`} item={item} type={type} />)}</div> : <EmptyState title="No recent requests" description="Your submitted applications and appointments will appear here." action={<Link href="/grievance" className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Raise a query</Link>} />}</section>
  </div>;
}