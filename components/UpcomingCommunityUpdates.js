"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/app/language-provider";
import CommunityUpdateCard from "./CommunityUpdateCard";

const SCHEDULED_KINDS = [
  ["meeting", "Meetings", "बैठकें"],
  ["camp", "Camps", "शिविर"],
  ["event", "Events", "कार्यक्रम"],
];

export default function UpcomingCommunityUpdates() {
  const { language } = useLanguage();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadUpdates = useCallback(async () => {
    try {
      const response = await fetch("/api/community-updates?scheduled=true", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.updates)) {
        throw new Error(data.message || "Unable to load scheduled community updates.");
      }
      setUpdates(data.updates);
      setError(false);
    } catch (loadError) {
      console.error("Homepage scheduled updates load failed:", loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpdates();
    const refreshInterval = setInterval(loadUpdates, 60000);
    window.addEventListener("focus", loadUpdates);
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("focus", loadUpdates);
    };
  }, [loadUpdates]);

  const scheduledUpdates = useMemo(() => updates, [updates]);

  const isHindi = language === "hi";
  const heading = isHindi ? "आगामी बैठकें, शिविर और कार्यक्रम" : "Upcoming meetings, camps & events";
  const empty = isHindi ? "फिलहाल कोई आगामी कार्यक्रम निर्धारित नहीं है।" : "No upcoming meetings, camps, or events are scheduled.";

  return (
    <section aria-labelledby="upcoming-community-updates" className="space-y-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-green-600 dark:text-green-400">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {isHindi ? "पंचायत कैलेंडर" : "Panchayat calendar"}
          </p>
          <h2 id="upcoming-community-updates" className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400 sm:text-3xl">{heading}</h2>
        </div>
        <Link href="/community" className="text-sm font-semibold text-green-700 underline decoration-green-300 underline-offset-4 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100">
          {isHindi ? "सभी सूचनाएं देखें" : "View all community updates"}
        </Link>
      </div>

      <div className="space-y-7">
        {SCHEDULED_KINDS.map(([kind, englishLabel, hindiLabel]) => {
          const sectionUpdates = scheduledUpdates.filter((item) => item.kind === kind);
          const label = isHindi ? hindiLabel : englishLabel;
          return (
            <section key={kind} aria-label={label}>
              <h3 className="mb-3 flex items-center gap-3 text-xl font-semibold text-green-600 dark:text-green-400">
                {label}
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-bold text-green-800 dark:bg-green-950 dark:text-green-200">
                  {loading || error ? "—" : sectionUpdates.length}
                </span>
              </h3>
              {loading ? (
                <p role="status" className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">{isHindi ? "सूचनाएं लोड हो रही हैं…" : "Loading scheduled updates…"}</p>
              ) : error ? (
                <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{isHindi ? "कार्यक्रम लोड नहीं हो सके।" : "Scheduled updates could not be loaded."}</p>
              ) : sectionUpdates.length === 0 ? (
                <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">{empty}</p>
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sectionUpdates.map((item) => (
                    <li key={item.id} className="h-full">
                      <CommunityUpdateCard item={item} language={language} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
