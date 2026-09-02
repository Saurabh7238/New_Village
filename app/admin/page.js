"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";
import { BarChart3, ChevronDown } from "lucide-react";

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
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-red-500">
        Access Denied. You must be an admin to view this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 dark:text-yellow-400">Admin Panel</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button onClick={() => signOut({ callbackUrl: "/?logout=true" })} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Sign Out
            </button>
          </div>
        </div>

        {showAnalytics && (
          <AdminAnalyticsDashboard />
        )}

        {!showAnalytics && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Management Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/applications?service=aadhaar-request" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              Aadhaar Requests {badge(serviceCounts['aadhaar-request'] || 0)}
            </Link>
            <Link href="/admin/applications?service=birth-certificate" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              Birth Certificates {badge(serviceCounts['birth-certificate'] || 0)}
            </Link>
            <Link href="/admin/applications?service=death-certificate" className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              Death Certificates {badge(serviceCounts['death-certificate'] || 0)}
            </Link>
            <Link href="/admin/members" className="bg-green-700 hover:bg-green-800 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              Panchayat Members
            </Link>
            <Link href="/admin/applications" className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              Service Applications {badge(applicationCount)}
            </Link>
            <Link href="/admin/queries" className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🎯 Query Management {badge(queryCount)}
            </Link>
            <Link href="/admin/appointments" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              Appointments
            </Link>
            <Link href="/admin/members" className="hidden">
              👥 Members
            </Link>
            <Link href="/admin/notifications" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              📢 Notifications
            </Link>
            <Link href="/admin/chats" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              💬 Live Chats
            </Link>
            <Link href="/admin/home" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🏠 Home Settings
            </Link>
            <Link href="/admin/reviews" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              ⭐ Reviews
            </Link>
            <Link href="/admin/activity-log" className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              Activity Log
            </Link>
            <Link href="/admin/gallery" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🖼️ Gallery
            </Link>
            <Link href="/admin/budget" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              💰 Budget
            </Link>
            <Link href="/admin/funds" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              💰 Funds
            </Link>
            <Link href="/admin/infrastructure" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🏗️ Infrastructure
            </Link>
            <Link href="/admin/documents" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              📁 Citizen Documents
            </Link>
            <Link href="/admin/users" className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              👤 Citizen Directory
            </Link>
            <Link href="/admin/voters" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🗳️ Voters
            </Link>
            <Link href="/admin/development" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
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
