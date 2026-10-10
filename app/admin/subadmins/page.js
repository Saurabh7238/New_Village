"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SubAdminManagementPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSubAdmins = async () => {
    const response = await fetch("/api/admin/subadmins");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not load sub-admins.");
    setUsers(data.users || []);
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      loadSubAdmins().catch((error) => setMessage(error.message));
    }
  }, [status, session?.user?.role]);

  const updateAccess = async (payload) => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/subadmins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update sub-admin access.");
      setIdentifier("");
      setMessage(data.message);
      await loadSubAdmins();
    } catch (error) {
      setMessage(error.message || "Could not update sub-admin access.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return <main className="p-8 text-center">Loading...</main>;
  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return <main className="p-8 text-center text-red-600">Main admin access required.</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-8">
      <Link href="/admin" className="text-sm font-semibold text-teal-700 hover:underline">Back to Admin</Link>
      <header>
        <h1 className="text-3xl font-bold">Sub-admin Access</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Grant an existing account access to service management. Their changes stay pending until a main admin approves them.
        </p>
      </header>
      <form
        onSubmit={(event) => { event.preventDefault(); updateAccess({ identifier, enabled: true }); }}
        className="flex flex-col gap-3 rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:flex-row"
      >
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          placeholder="Existing account phone number or email"
          className="min-w-0 flex-1 rounded border p-3 dark:border-slate-600 dark:bg-slate-800"
        />
        <button disabled={saving} className="rounded bg-teal-700 px-5 py-3 font-semibold text-white disabled:opacity-50">
          Grant sub-admin access
        </button>
      </form>
      {message && <p role="status" className="rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">{message}</p>}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Current sub-admins</h2>
        {users.length ? users.map((user) => (
          <article key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div>
              <p className="font-semibold">{user.name} <span className="text-xs font-normal text-slate-500">{user.uniqueId}</span></p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{user.email || user.phone} · {user.status}</p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => updateAccess({ userId: user.id, enabled: false })}
              className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Revoke
            </button>
          </article>
        )) : <p className="rounded border border-dashed p-5 text-sm text-slate-500">No sub-admin accounts yet.</p>}
      </section>
    </main>
  );
}
