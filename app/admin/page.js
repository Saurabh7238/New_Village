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
  const [serviceCounts, setServiceCounts] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'admin') return;
    const load = () => fetch('/api/service-notifications').then((response) => response.ok ? response.json() : null).then((data) => setServiceCounts(data?.byService || {})).catch(() => setServiceCounts({}));
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [status, session?.user?.role]);
  const queryCount = Object.entries(serviceCounts).filter(([type]) => type.startsWith('query:')).reduce((sum, [, count]) => sum + count, 0);
  const applicationCount = Object.entries(serviceCounts).filter(([type]) => !type.startsWith('query:')).reduce((sum, [, count]) => sum + count, 0);
  const badge = (count) => count > 0 ? <span className="ml-2 inline-grid min-w-5 place-items-center rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-red-700">{count}</span> : null;

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

        {showAnalytics && (
          <AdminAnalyticsDashboard />
        )}

        {!showAnalytics && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <h2 className="mb-5 text-xl font-bold">Management Sections</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/applications?service=aadhaar-request" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Aadhaar Requests {badge(serviceCounts['aadhaar-request'] || 0)}
            </Link>
            <Link href="/admin/applications?service=birth-certificate" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Birth Certificates {badge(serviceCounts['birth-certificate'] || 0)}
            </Link>
            <Link href="/admin/applications?service=death-certificate" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Death Certificates {badge(serviceCounts['death-certificate'] || 0)}
            </Link>
            <Link href="/admin/members" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Panchayat Members
            </Link>
            <Link href="/admin/applications" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Service Applications {badge(applicationCount)}
            </Link>
            <Link href="/admin/queries" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🎯 Query Management {badge(queryCount)}
            </Link>
            <Link href="/admin/appointments" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              Appointments
            </Link>
            <Link href="/admin/members" className="hidden">
              👥 Members
            </Link>
            <Link href="/admin/notifications" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              📢 Notifications
            </Link>
            <Link href="/admin/chats" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              💬 Live Chats
            </Link>
            <Link href="/admin/home" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              🏠 Home Settings
            </Link>
            <Link href="/admin/reviews" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
              ⭐ Reviews
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
