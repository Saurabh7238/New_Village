"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingNotification, setEditingNotification] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetch("/api/notifications").then((res) => res.json()).then((data) => setNotifications(data));
  }, []);

  const editNotification = (notification) => {
    setEditingNotification(notification);
    setEditTitle(notification.title);
    setEditDescription(notification.description);
    setTitle("");
    setDescription("");
  };

  const updateNotification = async (e) => {
    e.preventDefault();
    if (!editingNotification || !editTitle.trim() || !editDescription.trim()) {
      alert("Title and description are required.");
      return;
    }

    try {
      const res = await fetch(`/api/notifications?id=${editingNotification.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() }),
      });

      if (res.ok) {
        const result = await res.json();
        setNotifications(prev => prev.map(n => (n.id === editingNotification.id ? result.notification : n)));
        setEditingNotification(null);
        setEditTitle("");
        setEditDescription("");
      } else {
        alert("Update failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm("Delete permanently?")) return;
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications(prev => prev.filter((n) => n.id !== id));
        if (editingNotification?.id === id) setEditingNotification(null);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.");
      return;
    }

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const newItem = await res.json();
      if (res.ok) {
        setNotifications((prev) => [newItem, ...prev]);
        setTitle("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700 dark:text-yellow-400">Manage Notifications</h1>
          <button onClick={() => signOut()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sign Out</button>
        </div>

        {editingNotification ? (
          <form onSubmit={updateNotification} className="mb-8 space-y-4 p-4 border rounded-lg bg-yellow-50 dark:bg-gray-700">
            <h3 className="text-xl font-semibold">Editing: {editingNotification.title}</h3>
            <input className="border p-2 w-full rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            <textarea className="border p-2 w-full rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required rows="4" />
            <div className="flex gap-4">
              <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Save</button>
              <button type="button" onClick={() => setEditingNotification(null)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
            </div>
          </form>
        ) : (
          <form onSubmit={addNotification} className="mb-8 space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-blue-700 dark:text-yellow-400">Add New Notification</h3>
            <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Notification</button>
          </form>
        )}

        <h2 className="text-2xl font-bold mb-4">Notifications ({notifications.length})</h2>
        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.id} className={`border rounded p-4 flex justify-between items-center dark:border-gray-700 ${editingNotification?.id === n.id ? 'bg-yellow-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800'}`}>
              <div>
                <h2 className="font-semibold">{n.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{n.description}</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => editNotification(n)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                <button onClick={() => deleteNotification(n.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
