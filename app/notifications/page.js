"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load notifications");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid notifications response");
        setNotifications(data);
      })
      .catch((err) => {
        console.error("Error fetching notifications", err);
        setError(err.message || "Failed to load notifications");
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 pt-20">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>

      {loading && (
        <p className="text-gray-600">Loading notifications...</p>
      )}

      {!loading && error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-gray-600">No notifications available.</p>
      )}

      {!loading && !error && notifications.length > 0 && (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li key={n.id} className="border rounded p-4 hover:bg-gray-50">
              <Link href={`/notifications/${n.id}`}>
                <h2 className="text-xl font-semibold">{n.title}</h2>
                <p className="text-gray-600">{n.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
