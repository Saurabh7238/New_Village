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
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg flex justify-between items-center animate-slide-in ${
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
            className="ml-4 text-lg hover:opacity-70"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
