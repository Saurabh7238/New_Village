"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function NotificationDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setNotification(null);

    fetch("/api/notifications")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load notifications");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid notifications response");
        const item = data.find((n) => String(n.id) === String(id));
        if (item) {
          setNotification(item);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching notification", err);
        setError(err.message || "Failed to load notification");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-gray-600">Loading notification...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600">{error}</p>
        <Link href="/notifications" className="text-green-600 hover:underline">
          ← Back to Notifications
        </Link>
      </div>
    );
  }

  if (notFound || !notification) {
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
