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
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const [sendEmailById, setSendEmailById] = useState({});
  const [updateMessage, setUpdateMessage] = useState("");

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
    setUpdateMessage("");
    setUpdatingTicketId(id);
    try {
      const response = await fetch("/api/admin/chat-tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus, sendEmail: sendEmailById[id] !== false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update ticket.");
      setTickets((current) => current.map((ticket) => ticket._id === id ? { ...ticket, status: nextStatus } : ticket));
      const delivery = data.emailDelivery;
      setUpdateMessage(delivery?.status === "sent"
        ? "Ticket updated. Email sent."
        : delivery?.status === "disabled"
          ? "Ticket updated. Email disabled for this update."
          : delivery?.status === "skipped"
            ? `Ticket updated. Email not sent: ${delivery.reason}`
            : delivery?.status === "failed"
              ? `Ticket updated, but email failed: ${delivery.error}`
              : "Ticket updated. No email was needed.");
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingTicketId(null);
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
        {updateMessage && <p role="status" className={`mb-4 rounded-lg p-3 ${updateMessage.includes("failed") ? "bg-red-100 text-red-800" : updateMessage.includes("not sent") || updateMessage.includes("disabled") ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>{updateMessage}</p>}
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
                      <select id={`status-${ticket._id}`} value={ticket.status} disabled={updatingTicketId === ticket._id} onChange={(event) => updateStatus(ticket._id, event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800">
                        {TICKET_STATUSES.map((ticketStatus) => <option key={ticketStatus}>{ticketStatus}</option>)}
                      </select>
                      <label className="mt-2 flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={sendEmailById[ticket._id] !== false} onChange={(event) => setSendEmailById((current) => ({ ...current, [ticket._id]: event.target.checked }))} />
                        Send email for this update (overrides citizen preference)
                      </label>
                      {updatingTicketId === ticket._id && <span role="status" className="ml-2 text-xs font-semibold text-teal-700 dark:text-teal-300">Updating...</span>}
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
