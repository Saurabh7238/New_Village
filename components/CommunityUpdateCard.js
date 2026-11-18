"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, Eye, MapPin } from "lucide-react";

const KIND_LABELS = {
  camp: ["Camp", "शिविर"],
  meeting: ["Meeting", "बैठक"],
  event: ["Event", "कार्यक्रम"],
};

function formatDate(value, language) {
  if (!value) return "";
  return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function CommunityUpdateCard({ item, language }) {
  const cardRef = useRef(null);
  const trackedRef = useRef(false);
  const [views, setViews] = useState(Number.isSafeInteger(item.views) ? item.views : null);
  const isHindi = language === "hi";

  useEffect(() => {
    if (!cardRef.current || trackedRef.current) return undefined;

    const recordView = async () => {
      if (trackedRef.current) return;
      trackedRef.current = true;

      const sessionKey = `community-view:${item.id}`;
      try {
        if (sessionStorage.getItem(sessionKey)) return;
        sessionStorage.setItem(sessionKey, "1");
      } catch (error) {
        console.warn("Unable to check community view session:", error);
      }

      try {
        const response = await fetch(`/api/community-updates/${item.id}/view`, { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to record update view.");
        if (Number.isSafeInteger(data.views)) setViews(data.views);
      } catch (error) {
        try {
          sessionStorage.removeItem(sessionKey);
        } catch (storageError) {
          console.warn("Unable to clear community view session:", storageError);
        }
        console.error("Community update view tracking failed:", error);
      }
    };

    if (!("IntersectionObserver" in window)) {
      recordView();
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        recordView();
      }
    }, { threshold: 0.5 });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [item.id]);

  const kindLabel = KIND_LABELS[item.kind] || ["Update", "सूचना"];

  return (
    <article ref={cardRef} className="flex h-full items-start gap-3 rounded-lg bg-white p-4 text-slate-700 shadow transition hover:scale-[1.02] hover:shadow-md dark:bg-slate-800 dark:text-slate-200">
      <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-green-500" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-200">
            {isHindi ? kindLabel[1] : kindLabel[0]}
          </span>
          {item.startsAt && (
            <time className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400" dateTime={item.startsAt}>
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(item.startsAt, language)}
            </time>
          )}
        </div>
        <h4 className="mt-2 font-semibold text-slate-900 dark:text-white">{item.title}</h4>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
        {(item.location || item.schedule) && (
          <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {item.location && (
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                <span>{item.location}</span>
              </p>
            )}
            {item.schedule && (
              <p className="flex items-start gap-1.5">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                <span>{item.schedule}</span>
              </p>
            )}
          </div>
        )}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-400" aria-label={isHindi ? "अनुमानित दृश्य" : "Estimated views"}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {views === null ? (isHindi ? "अज्ञात" : "Unknown") : views}
      </span>
    </article>
  );
}
