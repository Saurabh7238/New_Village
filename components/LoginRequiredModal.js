"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginRequiredModal({ isOpen, onClose, callbackUrl }) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const signIn = () => {
    router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-800 dark:bg-slate-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-950">⚠️</div>
        <h2 id="login-required-title" className="text-xl font-bold text-slate-900 dark:text-white">Login required</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Please log in first to submit a request, service application, query, or suggestion.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
          <button type="button" onClick={signIn} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Login now</button>
        </div>
      </div>
    </div>
  );
}
