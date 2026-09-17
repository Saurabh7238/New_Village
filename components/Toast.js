"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", duration = 4000) => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, removeToast, isDark }) {
  return (
    <div className="fixed left-3 right-3 top-3 z-[120] space-y-2 sm:left-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-md" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="status"
          className={`flex min-h-12 items-center gap-3 justify-between rounded-lg border p-3 shadow-lg animate-slide-in sm:p-4 ${
            toast.type === "success"
              ? isDark
                ? "border-teal-700 bg-teal-950 text-teal-200"
                : "border-teal-200 bg-teal-50 text-teal-900"
              : toast.type === "error"
              ? isDark
                ? "border-red-700 bg-red-950 text-red-200"
                : "border-red-200 bg-red-50 text-red-900"
              : toast.type === "warning"
              ? isDark
                ? "border-amber-700 bg-amber-950 text-amber-200"
                : "border-amber-200 bg-amber-50 text-amber-900"
              : isDark
              ? "border-slate-700 bg-slate-900 text-slate-200"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> : toast.type === "error" ? <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /> : toast.type === "warning" ? <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" /> : <Info className="h-5 w-5 shrink-0" aria-hidden="true" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
