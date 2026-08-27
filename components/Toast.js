"use client";

import { useState, useEffect } from "react";

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
    <div className="fixed left-3 right-3 top-3 z-50 space-y-2 sm:left-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex min-h-12 items-center justify-between rounded-lg p-3 shadow-lg animate-slide-in sm:p-4 ${
            toast.type === "success"
              ? isDark
                ? "bg-green-900 text-green-200 border border-green-700"
                : "bg-green-100 text-green-800 border border-green-300"
              : toast.type === "error"
              ? isDark
                ? "bg-red-900 text-red-200 border border-red-700"
                : "bg-red-100 text-red-800 border border-red-300"
              : toast.type === "warning"
              ? isDark
                ? "bg-yellow-900 text-yellow-200 border border-yellow-700"
                : "bg-yellow-100 text-yellow-800 border border-yellow-300"
              : isDark
              ? "bg-blue-900 text-blue-200 border border-blue-700"
              : "bg-blue-100 text-blue-800 border border-blue-300"
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-3 grid h-11 w-11 shrink-0 place-items-center rounded text-lg hover:opacity-70"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
