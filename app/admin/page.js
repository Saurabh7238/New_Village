"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";
import { BarChart3, ChevronDown } from "lucide-react";
import Button from "@/components/Button";
import PageHeader from "@/components/PageHeader";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [requestCounts, setRequestCounts] = useState(null);
  const [requestCountsError, setRequestCountsError] = useState('');
  const [slaAlerts, setSlaAlerts] = useState({ count: 0, items: [], checkedAt: null, error: '' });
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'admin') return;
    const loadRequestCounts = () => fetch('/api/admin/request-counts', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load request counts.');
        setRequestCounts(data);
        setRequestCountsError('');
      })
      .catch((error) => {
        console.error('Admin request counts load failed:', error);
        setRequestCountsError('Request counts could not be loaded.');
      });
    const loadSlaAlerts = () => fetch('/api/admin/sla', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load overdue alerts.');
        setSlaAlerts({ ...data, error: '' });
      })
      .catch((error) => {
        console.error('Admin SLA alert load failed:', error);
        setSlaAlerts((current) => ({ ...current, error: 'Overdue grievance alerts could not be loaded.' }));
      });
    loadRequestCounts();
    loadSlaAlerts();
    const interval = setInterval(() => {
      loadRequestCounts();
      loadSlaAlerts();
    }, 60000);
    return () => clearInterval(interval);
  }, [status, session?.user?.role]);
  const requestBadge = (counts) => (
    <span className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold">
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-950 dark:text-blue-200">New {counts?.new ?? '—'}</span>
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">Due {counts?.due ?? '—'}</span>
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-100">All {counts?.all ?? '—'}</span>
    </span>
  );
  const applicationCount = (serviceType) => requestCounts?.applications?.byType?.[serviceType];

  if (status === "loading") {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-300">Loading...</div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="flex min-h-[calc(100vh-11rem)] items-center justify-center bg-slate-50 p-8 text-red-600 dark:bg-slate-950 dark:text-red-300">
        Access Denied. You must be an admin to view this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <PageHeader
          eyebrow="Administration"
          title="Admin Panel"
          description="Manage citizen services, content, records, and Panchayat operations."
          actions={<>
            <Button
              variant="secondary"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="min-h-10"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button variant="danger" onClick={() => signOut({ callbackUrl: "/?logout=true" })}>
              Sign Out
            </Button>
          </>}
        />

        {!showAnalytics && (
          <section aria-labelledby="overdue-grievances-heading" className={`rounded-xl border p-5 shadow-sm ${slaAlerts.count ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="overdue-grievances-heading" className="text-lg font-bold">
                  Overdue grievance alerts <span className={slaAlerts.count ? 'text-red-700 dark:text-red-300' : 'text-slate-500'}>({slaAlerts.count})</span>
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Based on the configured grievance acknowledgment and resolution SLAs.
                  {slaAlerts.checkedAt ? ` Checked ${new Date(slaAlerts.checkedAt).toLocaleTimeString()}.` : ''}
                </p>
              </div>
              <Link href="/admin/queries" className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800">
                Review grievances
              </Link>
            </div>
            {slaAlerts.error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{slaAlerts.error}</p>}
            {!slaAlerts.error && slaAlerts.items.length > 0 && (
              <ul className="mt-4 divide-y divide-red-200 dark:divide-red-900">
                {slaAlerts.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/queries/${item.id}`} className="font-semibold text-red-800 hover:underline dark:text-red-200">
                        {item.queryId} · {item.category} · Ward {item.ward}
                      </Link>
                      <p className="truncate text-sm text-slate-700 dark:text-slate-200">{item.subject}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-red-700 dark:text-red-300">
                      {item.breachType === 'acknowledgment' ? 'Acknowledgment overdue' : 'Resolution overdue'}
                      {item.overdueDays > 0 ? ` · ${item.overdueDays}d` : ` · ${item.overdueHours}h`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!slaAlerts.error && slaAlerts.count === 0 && (
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">No overdue grievances right now.</p>
            )}
            {!slaAlerts.error && slaAlerts.count > slaAlerts.items.length && (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                Showing the 10 oldest overdue grievances. Review the grievance list for the rest.
              </p>
            )}
          </section>
        )}

        {showAnalytics && (
          <AdminAnalyticsDashboard />
        )}

        {!showAnalytics && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <h2 className="mb-5 text-xl font-bold">Management Sections</h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">New = newly submitted · Due = awaiting action · All = total records</p>
          {requestCountsError && <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{requestCountsError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/applications?service=aadhaar-request" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Aadhaar Requests {requestBadge(applicationCount('aadhaar-request'))}
            </Link>
            <Link href="/admin/applications?service=birth-certificate" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Birth Certificates {requestBadge(applicationCount('birth-certificate'))}
            </Link>
            <Link href="/admin/applications?service=death-certificate" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Death Certificates {requestBadge(applicationCount('death-certificate'))}
            </Link>
            <Link href="/admin/members" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Panchayat Members
            </Link>
            <Link href="/admin/applications" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Service Applications {requestBadge(requestCounts?.applications)}
            </Link>
            <Link href="/admin/development" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Development Projects & Reports
            </Link>
            <Link href="/admin/chat-tickets" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Chatbot Support Tickets {requestBadge(requestCounts?.chatTickets)}
            </Link>
            <Link href="/admin/queries" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🎯 Query Management {requestBadge(requestCounts?.queries)}
            </Link>
            <Link href="/admin/appointments" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Appointments {requestBadge(requestCounts?.appointments)}
            </Link>
            <Link href="/admin/members" className="hidden">
              👥 Members
            </Link>
            <Link href="/admin/notifications" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              📢 Notice Board
            </Link>
            <Link href="/admin/data-backup" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Data Backup &amp; Recovery
            </Link>
            <Link href="/admin/chats" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              💬 Live Chats
            </Link>
            <Link href="/admin/home" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🏠 Home Settings
            </Link>
            <Link href="/admin/branding" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🎨 Logo, Favicon &amp; Media
            </Link>
            <Link href="/admin/reviews" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              ⭐ Reviews {requestBadge(requestCounts?.reviews)}
            </Link>
            <Link href="/admin/activity-log" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Activity Log
            </Link>
            <Link href="/admin/gallery" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🖼️ Gallery
            </Link>
            <Link href="/admin/budget" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              💰 Budget
            </Link>
            <Link href="/admin/funds" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              💰 Funds
            </Link>
            <Link href="/admin/infrastructure" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🏗️ Infrastructure
            </Link>
            <Link href="/admin/documents" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              📁 Citizen Documents
            </Link>
            <Link href="/admin/forms" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              📄 Public Forms
            </Link>
            <Link href="/admin/users" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              👤 Citizen Directory
            </Link>
            <Link href="/admin/voters" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🗳️ Voters
            </Link>
            <Link href="/admin/development" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🏗️ Development
            </Link>
          </div>
        </div>
        )}

        {!showAnalytics && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg border border-green-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Welcome to Admin Dashboard</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Select a management section above to manage different aspects of Chiutahara Portal.
          </p>
        </div>
        )}
      </div>
    </div>
  );
}
