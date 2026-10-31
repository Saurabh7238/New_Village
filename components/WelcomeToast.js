"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";

export default function WelcomeToast() {
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const { data: session, status } = useSession();

  const displayName =
    session?.user?.name || session?.user?.email?.split("@")[0] || null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isWelcome = params.get("welcome") === "true";
    const isLogout = params.get("logout") === "true";

    if (isWelcome && status === "loading") return undefined;
    if (isWelcome && status === "authenticated") {
      setMessage(`Welcome to Chiutahara Portal, ${displayName || "there"}!`);
      setShowToast(true);
      params.delete("welcome");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash || ""}`;
      window.history.replaceState({}, "", newUrl);
      const timeout = window.setTimeout(() => setShowToast(false), 5000);
      return () => window.clearTimeout(timeout);
    }

    if (isLogout) {
      setMessage("You have successfully logged out.");
      setShowToast(true);
      params.delete("logout");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash || ""}`;
      window.history.replaceState({}, "", newUrl);
      const timeout = window.setTimeout(() => setShowToast(false), 5000);
      return () => window.clearTimeout(timeout);
    }

    if (isWelcome && status === "unauthenticated") {
      params.delete("welcome");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash || ""}`;
      window.history.replaceState({}, "", newUrl);
    }
    return undefined;
  }, [displayName, status]);

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
