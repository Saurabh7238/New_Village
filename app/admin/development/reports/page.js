"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DevelopmentReportsPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    const response = await fetch("/api/admin/development-reports");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not load resident reports.");
    setReports(data);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && ["admin", "subadmin"].includes(session?.user?.role)) {
      loadReports().catch((loadError) => setError(loadError.message));
    }
  }, [loadReports, session?.user?.role, status]);

  const moderate = async (id, nextStatus) => {
    setError("");
    try {
      const response = await fetch("/api/admin/development-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update report status.");
      setReports((items) => items.map((item) => item._id === id ? { ...item, status: nextStatus } : item));
    } catch (moderationError) {
      setError(moderationError.message);
    }
  };

  if (status === "loading") return <main className="p-8 text-center">Loading...</main>;
  if (status !== "authenticated" || !["admin", "subadmin"].includes(session?.user?.role)) {
    return <main className="p-8 text-center text-red-700">Admin access required.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/development" className="text-green-700 hover:underline">← Development projects</Link>
        <h1 className="my-4 text-3xl font-bold">Resident project reports</h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">Reports appear publicly only after approval. Reporter identity is not shown on the public project page.</p>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
        {reports.length === 0 ? <p>No reports have been submitted.</p> : (
          <div className="space-y-4">
            {reports.map((report) => (
              <article key={report._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{report.category} — {report.projectId?.title || "Project removed"}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Ward {report.projectId?.wardNo ?? "—"} · Submitted by {report.userId?.name || "Resident"} · {new Date(report.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold dark:bg-slate-800">{report.status}</span>
                </div>
                <p className="my-4 whitespace-pre-wrap">{report.description}</p>
                <div className="flex gap-3">
                  <button onClick={() => moderate(report._id, "Approved")} disabled={report.status === "Approved"} className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Approve</button>
                  <button onClick={() => moderate(report._id, "Rejected")} disabled={report.status === "Rejected"} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Reject</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
