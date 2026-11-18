"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    <section aria-labelledby="upcoming-community-updates" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">
            {isHindi ? "पंचायत कैलेंडर" : "Panchayat calendar"}
          </p>
          <h2 id="upcoming-community-updates" className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">{heading}</h2>
        </div>
        <Link href="/community" className="text-sm font-bold text-teal-800 underline dark:text-teal-300">
          {isHindi ? "सभी सूचनाएं देखें" : "View all community updates"}
        </Link>
      </div>

      <div className="space-y-5">
        {SCHEDULED_KINDS.map(([kind, englishLabel, hindiLabel]) => {
          const sectionUpdates = scheduledUpdates.filter((item) => item.kind === kind);
          const label = isHindi ? hindiLabel : englishLabel;
          return (
            <section key={kind} aria-label={label} className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <h3 className="mb-3 flex items-center justify-between gap-3 font-bold text-slate-900 dark:text-white">
                {label}
                <span className="rounded-full bg-teal-700 px-2.5 py-0.5 text-sm text-white">
                  {loading || error ? "—" : sectionUpdates.length}
                </span>
              </h3>
              {loading ? (
                <p role="status" className="text-sm text-slate-500">{isHindi ? "सूचनाएं लोड हो रही हैं…" : "Loading scheduled updates…"}</p>
              ) : error ? (
                <p role="alert" className="text-sm text-red-700 dark:text-red-300">{isHindi ? "कार्यक्रम लोड नहीं हो सके।" : "Scheduled updates could not be loaded."}</p>
              ) : sectionUpdates.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {sectionUpdates.map((item) => <CommunityUpdateCard key={item.id} item={item} language={language} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
