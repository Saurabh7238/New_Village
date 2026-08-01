"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AdminPanel() {
  const { data: session, status } = useSession();

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
          <button onClick={() => signOut({ callbackUrl: "/?logout=true" })} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Sign Out
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Management Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/queries" className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🎯 Queries / 📋 शिकायत
            </Link>
            <Link href="/admin/members" className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              👥 Members
            </Link>
            <Link href="/admin/notifications" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              📢 Notifications
            </Link>
            <Link href="/admin/reviews" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              ⭐ Reviews
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
            <Link href="/admin/voters" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🗳️ Voters
            </Link>
            <Link href="/admin/development" className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-4 rounded-lg text-center font-semibold transition transform hover:scale-105">
              🏗️ Development
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg border border-green-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Welcome to Admin Dashboard</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Select a management section above to manage different aspects of Chiutahara Portal.
          </p>
        </div>
      </div>
    </div>
  );
}
