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
  ['other', 'Other Service'],
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [byService, setByService] = useState({});
  const [byRelatedType, setByRelatedType] = useState({});
  const [applications, setApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedRequestType, setSelectedRequestType] = useState('all');

  useEffect(() => { fetch('/api/me').then((r) => r.ok ? r.json() : null).then((data) => setUser(data?.user || null)); }, []);
  useEffect(() => {
    const load = () => fetch('/api/service-notifications').then((r) => r.ok ? r.json() : null).then((data) => { setByService(data?.byService || {}); setByRelatedType(data?.byRelatedType || {}); }).catch(() => { setByService({}); setByRelatedType({}); });
    load(); const interval = setInterval(load, 15000); return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    fetch('/api/applications').then((r) => r.ok ? r.json() : null).then((data) => setApplications(data?.applications || [])).catch(() => setApplications([]));
    fetch('/api/appointments?limit=50').then((r) => r.ok ? r.json() : null).then((data) => setAppointments(data?.appointments || [])).catch(() => setAppointments([]));
    fetch('/api/my-queries').then((r) => r.ok ? r.json() : null).then((data) => setQueries(data?.queries || [])).catch(() => setQueries([]));
  }, []);

  const recentRequests = [
    ...applications.map((item) => ({ item, type: 'application' })),
    ...appointments.map((item) => ({ item, type: 'appointment' })),
    ...queries.map((item) => ({ item, type: 'query' })),
  ].sort((a, b) => new Date(b.item.createdAt || b.item.appointmentDate) - new Date(a.item.createdAt || a.item.appointmentDate));
  const serviceCards = [
    { title: 'All requests', type: 'all', count: recentRequests.length },
    ...services.map(([serviceType, title]) => ({
      title,
      type: serviceType,
      count: applications.filter((application) => application.serviceType === serviceType).length,
      unreadCount: byService[serviceType] || 0,
    })),
    { title: 'My Queries', type: 'query', count: queries.length, unreadCount: byRelatedType.query || 0 },
    { title: 'My Appointments', type: 'appointment', count: appointments.length, unreadCount: byRelatedType.appointment || 0 },
  ];
  const visibleRequests = selectedRequestType === 'all'
    ? recentRequests
    : selectedRequestType === 'query' || selectedRequestType === 'appointment'
      ? recentRequests.filter((request) => request.type === selectedRequestType)
      : recentRequests.filter((request) => request.type === 'application' && request.item.serviceType === selectedRequestType);

  return <div className="mx-auto max-w-6xl py-4">
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Citizen Dashboard</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name || 'Citizen'}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Access your Panchayat services and personal information in one place.</p>
      <div className="mt-4 flex flex-wrap gap-2.5"><Link href="/grievance" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Raise New Query</Link><Link href="/dashboard/notifications" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 dark:border-slate-600 dark:text-slate-200">My Updates</Link><Link href="/dashboard/profile" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 dark:border-slate-600 dark:text-slate-200">My Profile</Link><Link href="/dashboard/documents" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 dark:border-slate-600 dark:text-slate-200">My Documents</Link></div>
    </section>
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">My requests by service</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {serviceCards.map(({ title, type, count, unreadCount = 0 }) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setSelectedRequestType(type);
              document.getElementById('request-timeline')?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-pressed={selectedRequestType === type}
            className={`relative rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md dark:bg-slate-900 ${
              selectedRequestType === type
                ? 'border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40'
                : 'border-slate-200 bg-white dark:border-slate-700'
            }`}
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
            <p className="mt-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
              {count} {count === 1 ? 'request' : 'requests'}
            </p>
            {unreadCount > 0 && <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">Updated ({unreadCount})</span>}
          </button>
        ))}
      </div>
    </section>
    <section id="request-timeline" className="mt-8 scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Request timeline & receipts</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {selectedRequestType === 'all' ? 'All your submitted service applications, queries, and appointments.' : `Your ${serviceCards.find((card) => card.type === selectedRequestType)?.title || 'service'} requests.`}
          </p>
        </div>
        <Link href="/dashboard/applications" className="text-sm font-bold text-teal-700 hover:underline dark:text-teal-300">View all applications</Link>
      </div>
      {visibleRequests.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleRequests.map(({ item, type }) => <RequestStatusCard key={`${type}-${item.id}`} item={item} type={type} />)}
        </div>
      ) : (
        <EmptyState
          title={selectedRequestType === 'all' ? 'No recent requests' : `No ${serviceCards.find((card) => card.type === selectedRequestType)?.title || 'service'} requests`}
          description="Requests you submit will appear here with their reference number and current status."
          action={<Link href={selectedRequestType === 'query' ? '/grievance' : selectedRequestType === 'appointment' ? '/appointments' : '/dashboard/applications'} className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Start a request</Link>}
        />
      )}
    </section>
  </div>;
}