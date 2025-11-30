"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications", err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      {notifications.length === 0 && (
        <p className="text-gray-600">No notifications available.</p>
      )}
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
    </div>
  );
}