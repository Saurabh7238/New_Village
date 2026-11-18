"use client";

import { Inbox } from "lucide-react";
import { useLanguage } from "@/app/language-provider";

export default function EmptyState({ title = "Nothing here yet", description, action }) {
  const { language } = useLanguage();
  const localizedTitle = title === "Nothing here yet" && language === "hi" ? "यहां अभी कुछ नहीं है" : title;

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{localizedTitle}</h2>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
