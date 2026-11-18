"use client";
import { withAdminTranslations } from "../admin-translations";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const KINDS = [
  ["meeting", "Meeting"],
  ["facility", "Facility hours or closure"],
  ["camp", "Health or agriculture camp"],
  ["event", "Event"],
  ["outage", "Service outage"],
];

const KIND_LABELS = {
  meeting: "Meeting",
  facility: "Facility",
  camp: "Camp",
  event: "Event",
  outage: "Service outage",
  "lost-found": "Lost & found",
};

const SCHEDULED_KINDS = ["meeting", "camp", "event"];

const EMPTY_FORM = {
  kind: "facility",
  title: "",
  description: "",
  location: "",
  schedule: "",
  startsAt: "",
  endsAt: "",
};

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function AdminCommunityPage() {
  const { data: session, status } = useSession();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");

  const loadUpdates = useCallback(async () => {
    try {
      const response = await fetch("/api/community-updates?admin=true", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load community listings.");
      setUpdates(data.updates || []);
    } catch (error) {
      console.error("Admin community listings load failed:", error);
      setMessage(error.message || "Unable to load community listings.");
    } finally {
      setLoading(false);
    }

  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") loadUpdates();
  }, [loadUpdates, session?.user?.role, status]);

  const submitUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "",
      };
      const response = await fetch("/api/community-updates", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to publish update.");
      setForm(EMPTY_FORM);
      setEditingId("");
      setMessage(editingId ? "Community update saved." : "Community update published.");
      await loadUpdates();
    } catch (error) {
      console.error("Community update save failed:", error);
      setMessage(error.message || "Unable to publish update.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item, nextStatus) => {
    setMessage("");
    try {
      const response = await fetch("/api/community-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update listing.");
      await loadUpdates();
    } catch (error) {
      console.error("Community listing moderation failed:", error);
      setMessage(error.message || "Unable to update listing.");
    }
  };

  const removeListing = async (item) => {
    if (!window.confirm(`Permanently remove "${item.title}"?`)) return;
    setMessage("");
    try {
      const response = await fetch("/api/community-updates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to remove listing.");
      setUpdates((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      console.error("Community listing removal failed:", error);
      setMessage(error.message || "Unable to remove listing.");
    }
  };

  const editListing = (item) => {
    setEditingId(item.id);
    setForm({
      kind: item.kind,
      title: item.title,
      description: item.description,
      location: item.location || "",
      schedule: item.schedule || "",
      startsAt: localDateTime(item.startsAt),
      endsAt: localDateTime(item.endsAt),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status === "loading") return <p className="p-8 text-center">Loading…</p>;
  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return <p className="p-8 text-center text-red-700">Admin access required.</p>;
  }

  const pending = updates.filter((item) => item.status === "pending");
  const published = updates.filter((item) => item.status !== "pending");

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Administration</p>
          <h1 className="mt-1 text-3xl font-extrabold">Community information</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Publish facility hours, camps, and service outages; review resident lost-and-found submissions.</p>
        </div>
        <Link href="/admin" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">Back to Admin</Link>
      </header>

      {message && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{message}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{editingId ? "Edit community update" : "Publish an update"}</h2>
          {editingId && <button type="button" onClick={() => { setEditingId(""); setForm(EMPTY_FORM); }} className="text-sm font-semibold text-slate-600 underline dark:text-slate-300">Cancel edit</button>}
        </div>
        <form onSubmit={submitUpdate} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Update type
            <select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800">
              {KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Title
            <input required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Details
            <textarea required minLength={5} maxLength={2000} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold">
            Facility / service location
            <input maxLength={200} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold">
            Schedule / hours
            <input maxLength={300} value={form.schedule} onChange={(event) => setForm((current) => ({ ...current, schedule: event.target.value }))} placeholder="e.g. Mon–Fri, 9 AM–5 PM" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold">
            {SCHEDULED_KINDS.includes(form.kind) ? "Starts (required)" : "Starts (optional)"}
            <input required={SCHEDULED_KINDS.includes(form.kind)} type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold">
            Ends (optional)
            <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <button disabled={saving} className="min-h-11 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60 md:col-span-2">
            {saving ? "Saving…" : editingId ? "Save changes" : "Publish update"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <h2 className="text-xl font-bold">Resident submissions awaiting review ({pending.length})</h2>
        {loading ? <p className="mt-3">Loading submissions…</p> : pending.length === 0 ? <p className="mt-3 text-sm">No submissions waiting for review.</p> : (
          <ul className="mt-4 space-y-3">
            {pending.map((item) => (
              <li key={item.id} className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-900 dark:bg-slate-900">
                <h3 className="font-bold">{item.isLost ? "Lost" : "Found"}: {item.title}</h3>
                <p className="mt-1 text-sm">{item.description}</p>
                <p className="mt-1 text-sm"><strong>Location:</strong> {item.location}</p>
                {item.reporterName && <p className="mt-1 text-sm"><strong>Reporter:</strong> {item.reporterName}</p>}
                {item.reporterContact && <p className="mt-1 text-sm"><strong>Private contact:</strong> {item.reporterContact}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => updateStatus(item, "published")} className="rounded bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Approve & publish</button>
                  <button onClick={() => updateStatus(item, "rejected")} className="rounded bg-slate-700 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                  <button onClick={() => removeListing(item)} className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900 dark:text-red-300">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Published and reviewed updates</h2>
        {loading ? <p className="mt-3">Loading updates…</p> : published.length === 0 ? <p className="mt-3 text-sm text-slate-500">No reviewed listings yet.</p> : (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
            {published.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{KIND_LABELS[item.kind]} · {item.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.status} · {item.location || "No location"} · {Number.isSafeInteger(item.views) ? item.views : "Unknown"} views</p>
                </div>
                <div className="flex gap-2">
                  {["facility", "camp", "outage", "meeting", "event"].includes(item.kind) && <button onClick={() => editListing(item)} className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">Edit</button>}
                  {item.status === "published" && <button onClick={() => updateStatus(item, "resolved")} className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">Mark resolved</button>}
                  <button onClick={() => removeListing(item)} className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:text-red-300">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default withAdminTranslations(AdminCommunityPage);
