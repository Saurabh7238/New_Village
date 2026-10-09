"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

const statusStyles = {
  Open: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  Resolved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  Closed: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
};

export default function ChatTicketTrackPage() {
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get("ticketId") || "");
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trackTicket = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    setTicket(null);
    try {
      const response = await fetch(`/api/chat/tickets?ticketId=${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not find this ticket.");
      setTicket(data.ticket);
    } catch (trackError) {
      setError(trackError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTicketId = searchParams.get("ticketId");
    if (authStatus === "authenticated" && initialTicketId) {
      setTicketId(initialTicketId);
      trackTicket(initialTicketId);
    }
  }, [authStatus, searchParams, trackTicket]);

  const submit = (event) => {
    event.preventDefault();
    trackTicket(ticketId.trim().toUpperCase());
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <Link href="/" className="text-sm font-semibold text-teal-800 hover:underline dark:text-teal-300">← Home</Link>
        <h1 className="mt-4 text-3xl font-bold">Track chatbot ticket</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Enter the ticket number from your chatbot confirmation. Sign in to view tickets linked to your account.</p>
        {authStatus !== "authenticated" ? (
          <button onClick={() => signIn(undefined, { callbackUrl: window.location.href })} className="mt-6 rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">Sign in to continue</button>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="chat-ticket-id">Ticket number</label>
            <input id="chat-ticket-id" value={ticketId} onChange={(event) => setTicketId(event.target.value.toUpperCase())} placeholder="CHT-YYYYMMDD-ABC123" required maxLength={40} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800" />
            <button disabled={loading} className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{loading ? "Checking..." : "Track ticket"}</button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
        {ticket && (
          <section aria-live="polite" className="mt-6 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ticket number</p>
                <p className="text-xl font-bold text-teal-800 dark:text-teal-300">#{ticket.ticketId}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusStyles[ticket.status] || statusStyles.Open}`}>{ticket.status}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500 dark:text-slate-400">Service</dt><dd className="mt-1 font-semibold">{ticket.service}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">Ward</dt><dd className="mt-1 font-semibold">Ward {ticket.ward}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500 dark:text-slate-400">Submitted</dt><dd className="mt-1 font-semibold">{new Date(ticket.createdAt).toLocaleString("en-IN")}</dd></div>
            </dl>
            <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">Keep this ticket number for future reference. Contact the Panchayat office if you need additional help.</p>
            <button type="button" onClick={() => trackTicket(ticket.ticketId)} disabled={loading} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">
              {loading ? "Refreshing..." : "Refresh status"}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
