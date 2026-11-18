"use client";

import DottedSpinner from "@/components/DottedSpinner";
import { useLanguage } from "@/app/language-provider";

export default function LoadingSpinner({ message = "Loading..." }) {
  const { labels } = useLanguage();
  return (
    <div className="flex min-h-[18rem] items-center justify-center px-4 py-10">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <DottedSpinner label={message === "Loading..." ? labels.loading : message} />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {message}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {labels.loadingMessage}
        </p>
      </div>
    </div>
  );
}
