"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";

export default function WelcomeToast() {
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const { data: session } = useSession();

  const displayName =
    session?.user?.name || session?.user?.email?.split("@")[0] || null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isWelcome = params.get("welcome") === "true";
    const isLogout = params.get("logout") === "true";

    if (isWelcome || isLogout) {
      if (isWelcome) {
        setMessage(`Welcome to Chiutahara Portal${displayName ? `, ${displayName}` : ""}!`);
      } else {
        setMessage("You have successfully logged out.");
      }
      setShowToast(true);
      params.delete("welcome");
      params.delete("logout");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash || ""}`;
      window.history.replaceState({}, "", newUrl);
      const timeout = window.setTimeout(() => setShowToast(false), 5000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [displayName]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-6xl px-4 py-4 text-center text-sm font-semibold text-green-900 bg-white/95 dark:bg-gray-900/95 dark:text-green-100 border-b border-green-200 dark:border-green-800"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
