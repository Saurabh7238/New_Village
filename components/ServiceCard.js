"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
        className="group flex min-h-[5.5rem] items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm
          transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md
          dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-700"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform duration-200 group-hover:scale-105 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Icon className="text-lg" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="mt-0.5 text-xs leading-4 text-slate-500 dark:text-slate-400">{hindi}</p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
