"use client";

import { useEffect, useRef, useState } from "react";

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
    <article ref={cardRef} className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            {isHindi ? kindLabel[1] : kindLabel[0]}
          </span>
          <h3 className="mt-2 font-bold">{item.title}</h3>
        </div>
        {item.startsAt && (
          <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={item.startsAt}>
            {formatDate(item.startsAt, language)}
          </time>
        )}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{item.description}</p>
      {item.location && <p className="mt-2 text-sm"><strong>{isHindi ? "स्थान" : "Location"}:</strong> {item.location}</p>}
      {item.schedule && <p className="mt-1 text-sm"><strong>{isHindi ? "समय" : "Schedule"}:</strong> {item.schedule}</p>}
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {isHindi
          ? `अनुमानित दृश्य (प्रति सत्र एक): ${views === null ? "अज्ञात" : views}`
          : `Estimated views (once per session): ${views === null ? "Unknown" : views}`}
      </p>
    </article>
  );
}
