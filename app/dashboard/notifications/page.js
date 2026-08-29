'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getLabel(notification) {
  if (notification.relatedType === 'query') return 'Query';
  if (notification.relatedType === 'appointment') return 'Appointment';
  return notification.serviceType.replace(/[-:]/g, ' ');
}

export default function MyNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/my-notifications');
      if (!response.ok) throw new Error('Unable to load updates.');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    await fetch('/api/my-notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item));
  };

  const markAllRead = async () => {
    await fetch('/api/my-notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead && notification.adminResponded).length;
  const visibleNotifications = notifications.filter((notification) => filter === 'all' || (filter === 'unread' && !notification.isRead) || notification.relatedType === filter);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">Citizen Dashboard</p>
            <h1 className="text-3xl font-bold">My Updates</h1>
          </div>
          {unreadCount > 0 && <button onClick={markAllRead} className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800">Mark all as read</button>}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[['all', 'All'], ['query', 'Queries'], ['application', 'Applications'], ['appointment', 'Appointments'], ['unread', 'Unread']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded px-3 py-2 text-sm font-semibold ${filter === value ? 'bg-green-700 text-white' : 'bg-white text-gray-700 shadow dark:bg-gray-800 dark:text-gray-200'}`}>{label}</button>)}
        </div>

        {message && <p className="mb-4 rounded bg-red-100 p-3 text-red-800 dark:bg-red-900 dark:text-red-100">{message}</p>}
        {loading ? <p>Loading updates...</p> : notifications.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">No service updates yet.</div>
        ) : visibleNotifications.length === 0 ? <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">No updates match this filter.</div> : (
          <div className="space-y-3">
            {visibleNotifications.map((notification) => (
              <article key={notification.id} className={`rounded-lg border bg-white p-4 shadow dark:bg-gray-800 ${notification.isRead ? 'border-gray-200 dark:border-gray-700' : 'border-red-400 ring-1 ring-red-200 dark:border-red-500'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">{getLabel(notification)}</span>
                      {!notification.isRead && <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">New</span>}
                    </div>
                    <h2 className="font-bold">{notification.title}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatDate(notification.adminResponded || notification.updatedAt)}</p>
                  </div>
                  <Link href={notification.link} onClick={() => !notification.isRead && markRead(notification.id)} className="shrink-0 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">View</Link>
                </div>
                {!notification.isRead && <button onClick={() => markRead(notification.id)} className="mt-3 text-sm font-semibold text-green-700 underline dark:text-green-300">Mark as read</button>}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
