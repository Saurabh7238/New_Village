"use client";

import { useLanguage } from "@/app/language-provider";

export default function LanguageBanner() {
  const { labels } = useLanguage();

  return (
    <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-center py-2 text-sm font-medium transition-colors">
      {labels.banner}
    </div>
  );
}
