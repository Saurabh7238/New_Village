"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function NotificationDetailPage() {
  const params = useParams();
  const id = params.id; // notification id from URL
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        const item = data.find((n) => String(n.id) === id);
        setNotification(item);
      })
      .catch((err) => console.error("Error fetching notification", err));
  }, [id]);

  if (!notification) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-gray-600">Notification not found.</p>
        <Link href="/notifications" className="text-green-600 hover:underline">
          ← Back to Notifications
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{notification.title}</h1>
      <p className="text-gray-700 mb-6">{notification.description}</p>
      <Link href="/notifications" className="text-green-600 hover:underline">
        ← Back to Notifications
      </Link>
    </div>
  );
}