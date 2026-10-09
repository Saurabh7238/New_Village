"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const TICKET_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export default function AdminChatTicketsPage() {
  const { data: session, status: authStatus } = useSession();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/chat-tickets");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load tickets.");
      setTickets(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.role === "admin") loadTickets();
  }, [authStatus, loadTickets, session?.user?.role]);

  const updateStatus = async (id, nextStatus) => {
    setError("");
    try {
      const response = await fetch("/api/admin/chat-tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update ticket.");
      setTickets((current) => current.map((ticket) => ticket._id === id ? { ...ticket, status: nextStatus } : ticket));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  if (authStatus === "loading" || loading) return <main className="p-8 text-center">Loading tickets…</main>;
  if (authStatus !== "authenticated" || session?.user?.role !== "admin") return <main className="p-8 text-center text-red-700">Admin access required.</main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm font-semibold text-teal-800 hover:underline dark:text-teal-300">← Admin panel</Link>
        <div className="my-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-3xl font-bold">Chatbot support tickets</h1><p className="mt-1 text-slate-600 dark:text-slate-300">{tickets.length} recent tickets</p></div>
          <button onClick={() => { setLoading(true); loadTickets(); }} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Refresh</button>
        </div>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
        {tickets.length === 0 ? <p className="rounded-xl bg-white p-6 dark:bg-slate-900">No chatbot tickets yet.</p> : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800"><tr>{["Ticket", "Resident", "Service", "Ward", "Submitted", "Status"].map((heading) => <th key={heading} className="px-4 py-3 font-bold">{heading}</th>)}</tr></thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 font-bold">{ticket.ticketId}</td>
                    <td className="px-4 py-3">{ticket.userName}</td>
                    <td className="px-4 py-3">{ticket.service}</td>
                    <td className="px-4 py-3">Ward {ticket.ward}</td>
                    <td className="px-4 py-3">{new Date(ticket.createdAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`status-${ticket._id}`}>Status for {ticket.ticketId}</label>
                      <select id={`status-${ticket._id}`} value={ticket.status} onChange={(event) => updateStatus(ticket._id, event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
                        {TICKET_STATUSES.map((ticketStatus) => <option key={ticketStatus}>{ticketStatus}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
