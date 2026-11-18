"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/app/language-provider";
import CommunityUpdateCard from "@/components/CommunityUpdateCard";

const KIND_LABELS = {
  facility: ["Facility hours & closures", "सुविधा समय और बंद होने की सूचना"],
  meeting: ["Meetings", "बैठकें"],
  camp: ["Health & agriculture camps", "स्वास्थ्य और कृषि शिविर"],
  event: ["Events", "कार्यक्रम"],
  outage: ["Service outages", "सेवा बाधित होने की सूचना"],
  "lost-found": ["Lost & found", "खोया-पाया"],
};

export default function CommunityPage() {
  const { language } = useLanguage();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    kind: "lost-found",
    isLost: true,
    title: "",
    description: "",
    location: "",
    reporterName: "",
    reporterContact: "",
  });

  const loadUpdates = useCallback(async () => {
    try {
      const response = await fetch("/api/community-updates", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load updates.");
      setUpdates(data.updates || []);
      setError("");
    } catch (loadError) {
      console.error("Community updates load failed:", loadError);
      setError("Community updates are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const submitLostFound = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/community-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to submit your listing.");
      setMessage(data.message);
      setForm({
        kind: "lost-found",
        isLost: true,
        title: "",
        description: "",
        location: "",
        reporterName: "",
        reporterContact: "",
      });
    } catch (submitError) {
      setMessage(submitError.message || "Unable to submit your listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const text = language === "hi"
    ? {
      title: "गांव की जानकारी और सूचनाएं",
      intro: "सुविधाओं का समय, शिविर, सेवा बाधाएं और खोया-पाया सूचनाएं।",
      where: "स्थान",
      schedule: "समय",
      details: "विवरण",
      closed: "समाप्त",
      form: "खोया-पाया सूचना भेजें",
      lost: "खोया",
      found: "मिला",
      item: "वस्तु का नाम",
      description: "विवरण",
      location: "कहां खोया या मिला",
      name: "आपका नाम (वैकल्पिक)",
      contact: "संपर्क विवरण (वैकल्पिक)",
      privacy: "आपका नाम और संपर्क केवल पंचायत व्यवस्थापक देखेंगे। प्रकाशित करने से पहले सूचना की समीक्षा होगी।",
      submit: "समीक्षा के लिए भेजें",
      loading: "सूचनाएं लोड हो रही हैं…",
      error: "सूचनाएं उपलब्ध नहीं हैं।",
      empty: "अभी कोई प्रकाशित सूचना नहीं है।",
    }
    : {
      title: "Village information & updates",
      intro: "Facility hours, camps, service outages, and lost-and-found listings.",
      where: "Location",
      schedule: "Schedule",
      details: "Details",
      closed: "Ended",
      form: "Submit a lost-and-found listing",
      lost: "Lost",
      found: "Found",
      item: "Item title",
      description: "Description",
      location: "Where was it lost or found?",
      name: "Your name (optional)",
      contact: "Contact details (optional)",
      privacy: "Your name and contact details are only visible to Panchayat admins. Listings are reviewed before publication.",
      submit: "Submit for review",
      loading: "Loading community updates…",
      error: "Community updates are unavailable.",
      empty: "There are no published updates right now.",
    };

  const groupedUpdates = Object.fromEntries(
    Object.keys(KIND_LABELS).map((kind) => [kind, updates.filter((item) => item.kind === kind)])
  );

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
          Gram Panchayat
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">{text.title}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{text.intro}</p>
        <Link href="/emergency" className="mt-3 inline-block font-semibold text-red-700 underline dark:text-red-300">
          {language === "hi" ? "आपातकालीन संपर्क" : "Emergency contacts"}
        </Link>
      </header>

      {loading && <p role="status">{text.loading}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">{text.error}</p>}

      {!loading && !error && (
        <div className="grid gap-5 md:grid-cols-2">
          {Object.entries(KIND_LABELS).map(([kind, labels]) => (
            <section key={kind} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h2 className="flex items-center justify-between gap-2 text-xl font-bold">
                    {language === "hi" ? labels[1] : labels[0]}
                    <span className="rounded-full bg-teal-700 px-2.5 py-0.5 text-sm text-white">{groupedUpdates[kind].length}</span>
                  </h2>
              {groupedUpdates[kind].length ? (
                <ul className="mt-4 space-y-3">
                  {groupedUpdates[kind].map((item) => (
                        <li key={item.id}>
                          {kind === "lost-found" && <p className="mb-1 text-xs font-semibold">{item.isLost ? text.lost : text.found}</p>}
                          <CommunityUpdateCard item={item} language={language} />
                        </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{text.empty}</p>
              )}
            </section>
          ))}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">{text.form}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{text.privacy}</p>
        <form onSubmit={submitLostFound} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {text.lost} / {text.found}
            <select
              value={form.isLost ? "lost" : "found"}
              onChange={(event) => setForm((current) => ({ ...current, isLost: event.target.value === "lost" }))}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="lost">{text.lost}</option>
              <option value="found">{text.found}</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            {text.item}
            <input required maxLength={120} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            {text.description}
            <textarea required minLength={5} maxLength={2000} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold">
            {text.location}
            <input required maxLength={200} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold">
            {text.name}
            <input maxLength={100} value={form.reporterName} onChange={(event) => setForm((current) => ({ ...current, reporterName: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            {text.contact}
            <input maxLength={100} value={form.reporterContact} onChange={(event) => setForm((current) => ({ ...current, reporterContact: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800" />
          </label>
          {message && <p role="status" className="text-sm sm:col-span-2">{message}</p>}
          <button disabled={submitting} className="min-h-11 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:col-span-2">
            {submitting ? "…" : text.submit}
          </button>
        </form>
      </section>
    </main>
  );
}
