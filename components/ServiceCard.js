"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import LoginRequiredModal from "./LoginRequiredModal";
import {
  FaFileAlt,
  FaUsers,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaCogs,
  FaClipboard,
  FaSearch,
} from "react-icons/fa";

// Icon mapping by title
const iconMap = {
  "Raise Query": FaClipboard,
  "Track Query": FaSearch,
  "Birth Certificates": FaFileAlt,
  "Death Certificates": FaFileAlt,
  "Aadhar Create / Update": FaCogs,
  "Voter List": FaUsers,
  "Gram Budget": FaMoneyBillWave,
  "Panchayat Funds": FaMoneyBillWave,
  "Map": FaMapMarkedAlt,
};

export default function ServiceCard({ title, hindi, href, index }) {
  const Icon = iconMap[title] || FaCogs;
  const { status } = useSession();
  const [isVisited, setIsVisited] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const requiresLogin = ["Raise Query", "Birth Certificates", "Death Certificates", "Aadhaar Create / Update", "Appointments"].includes(title);

  useEffect(() => {
    try {
      const visited = JSON.parse(localStorage.getItem("portal-visited-links") || "[]");
      setIsVisited(Array.isArray(visited) && visited.includes(href));
    } catch {
      setIsVisited(false);
    }
  }, [href]);

  const markVisited = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("portal-visited-links") || "[]");
      const next = [...new Set([href, ...(Array.isArray(saved) ? saved : [])])].slice(0, 20);
      localStorage.setItem("portal-visited-links", JSON.stringify(next));
    } catch {
      // ignore localStorage write errors
    }
  };

  const handleClick = (event) => {
    if (requiresLogin && status !== "authenticated") {
      event.preventDefault();
      setShowLoginWarning(true);
      return;
    }
    markVisited();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      className="w-full"
    >
      <Link
        href={href}
        aria-label={`Manage ${title}`}
        onClick={handleClick}
        className={`group flex min-h-[5.5rem] items-center rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
          isVisited
            ? "border-amber-300 bg-amber-50 text-amber-900 shadow-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
            : "border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-700"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
            isVisited
              ? "bg-amber-200 text-amber-900 dark:bg-amber-800/60 dark:text-amber-100"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          }`}>
            <Icon className="text-lg" />
          </span>
          <div className="min-w-0">
            <h3 className={`text-sm font-semibold leading-5 ${isVisited ? "text-amber-900 dark:text-amber-100" : "text-slate-800 dark:text-slate-100"}`}>{title}</h3>
            <p className={`mt-0.5 text-xs leading-4 ${isVisited ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>{hindi}</p>
          </div>
        </div>
      </Link>
      <LoginRequiredModal isOpen={showLoginWarning} onClose={() => setShowLoginWarning(false)} callbackUrl={href} />
    </motion.article>
  );
}
