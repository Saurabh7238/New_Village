"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

const cards = [
  ['My Queries', '0', '/track', 'View My Queries'],
  ['My Applications', '0', '#', 'Coming soon'],
  ['My Appointments', '0', '/appointments', 'View Appointments'],
  ['Notifications', '0', '/notifications', 'View Notifications'],
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  useEffect(() => { fetch('/api/me').then((r) => r.ok ? r.json() : null).then((data) => setUser(data?.user || null)); }, []);

  return <div className="mx-auto max-w-6xl py-4">
    <section className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-5 shadow-sm dark:border-green-800 dark:from-gray-800 dark:to-gray-900">
      <p className="text-sm font-semibold text-green-700 dark:text-green-300">Citizen Dashboard</p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name || 'Citizen'}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Access your Panchayat services and personal information in one place.</p>
      <div className="mt-4 flex flex-wrap gap-3"><Link href="/grievance" className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">Raise New Query</Link><Link href="/dashboard/profile" className="rounded-md border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 dark:text-green-300">My Profile</Link></div>
    </section>
    <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([title, count, href, action]) => <div key={title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p><p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">{count}</p>{href === '#' ? <span className="mt-4 inline-block text-sm text-gray-500">{action}</span> : <Link href={href} className="mt-4 inline-block text-sm font-semibold text-green-700 hover:underline dark:text-green-300">{action}</Link>}</div>)}</section>
  </div>;
}
