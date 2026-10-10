"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const dateLabel = (value) => value ? new Date(value).toLocaleString() : "—";

export default function ServiceChangeApprovalsPage() {
  const { data: session, status } = useSession();
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const loadChanges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/service-changes");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load service changes.");
      setChanges(data.changes || []);
    } catch (error) {
      setMessage(error.message || "Could not load service changes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      loadChanges();
    }
  }, [status, session?.user?.role, loadChanges]);

  const review = async (change, decision) => {
    const action = decision === "approve" ? "apply this change" : "reject this change";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setBusyId(change.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/service-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: change.id, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not review service change.");
      setMessage(decision === "approve" ? "Approved change was applied to the service." : "Change was rejected.");
      await loadChanges();
    } catch (error) {
      setMessage(error.message || "Could not review service change.");
      await loadChanges();
    } finally {
      setBusyId("");
    }
  };

  if (status === "loading") return <main className="p-8 text-center">Loading...</main>;
  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return <main className="p-8 text-center text-red-600">Main admin access required.</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-teal-700 hover:underline">Back to Admin</Link>
          <h1 className="mt-2 text-3xl font-bold">Service Change Approvals</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review sub-admin proposals. Approved changes are applied using the main-admin approval.</p>
        </div>
        <button type="button" onClick={loadChanges} className="rounded border px-4 py-2 text-sm font-semibold">Refresh</button>
      </div>
      {message && <p role="status" className="rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">{message}</p>}
      {loading ? <p className="rounded border p-6 text-center">Loading service changes...</p> : changes.length ? (
        <div className="space-y-4">
          {changes.map((change) => (
            <article key={change.id} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{change.method} {change.path}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Proposed by {change.submittedByName || "Sub-admin"} · {dateLabel(change.createdAt)}
                  </p>
                  {change.reviewedAt && <p className="text-sm text-slate-500">Reviewed {dateLabel(change.reviewedAt)} by {change.reviewedByName || "Main admin"}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${change.status === "pending" ? "bg-amber-100 text-amber-800" : change.status === "failed" ? "bg-red-100 text-red-800" : change.status === "approved" ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
                  {change.status}
                </span>
              </div>
              {change.preview && (
                <pre className="max-h-72 overflow-auto rounded bg-slate-50 p-3 text-xs dark:bg-slate-950">
                  {JSON.stringify(change.preview, null, 2)}
                </pre>
              )}
              {change.reviewMessage && <p className="text-sm text-slate-600 dark:text-slate-300">{change.reviewMessage}</p>}
              {["pending", "failed"].includes(change.status) && (
                <div className="flex flex-wrap gap-3">
                  <button disabled={busyId === change.id} onClick={() => review(change, "approve")} className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {busyId === change.id ? "Processing..." : "Approve and apply"}
                  </button>
                  <button disabled={busyId === change.id} onClick={() => review(change, "reject")} className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : <p className="rounded border border-dashed p-8 text-center text-slate-500">No service change proposals.</p>}
    </main>
  );
}
