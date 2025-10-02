"use client";
import { useEffect, useState } from "react";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [newText, setNewText] = useState("");
  const [newHref, setNewHref] = useState("");

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then(setNotifications);
  }, []);

  const addNotification = async () => {
    if (!newText || !newHref) return;

    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText, href: newHref }),
    });

    const newItem = await res.json();
    setNotifications((prev) => [...prev, newItem]);

    setNewText("");
    setNewHref("");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Manage Notifications</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Notification text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="border p-2 flex-1"
        />
        <input
          type="text"
          placeholder="/notifications/your-page"
          value={newHref}
          onChange={(e) => setNewHref(e.target.value)}
          className="border p-2 flex-1"
        />
        <button
          onClick={addNotification}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Add
        </button>
      </div>

      <ul>
        {notifications.map((n) => (
          <li key={n.id} className="border p-2 mb-2 rounded">
            <div className="font-medium">{n.text}</div>
            <div className="text-sm text-gray-500">{n.href}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}