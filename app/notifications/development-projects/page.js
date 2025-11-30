"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setNotifications(data))
      .catch((err) => {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications available.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((note) => (
              <li
                key={note.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => note.link && router.push(note.link)}
              >
                <h2 className="font-semibold">{note.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">{note.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}