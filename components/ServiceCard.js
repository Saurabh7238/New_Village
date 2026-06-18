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
  "Raise Query / शिकायत दर्ज": FaClipboard,
  "Track Query / शिकायत ट्रैक करें": FaSearch,
  "Birth Certificates": FaFileAlt,
  "Death Certificates": FaFileAlt,
  "Aadhar Create / Update": FaCogs,
  "Voter List": FaUsers,
  "Gram Budget": FaMoneyBillWave,
  "Map": FaMapMarkedAlt,
};

export default function ServiceCard({ title, href, index }) {
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
        className="group block p-6 sm:p-4 rounded-xl shadow-md
          hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]
          transition-all duration-300 ease-out
          border-l-4 border-green-600 hover:border-green-700
          bg-gradient-to-br from-white to-green-50"
      >
        <div className="flex items-center gap-3 mb-2">
          <Icon className="text-green-700 text-xl transform transition-transform duration-200 group-hover:scale-110" />
          <h3 className="text-lg font-semibold text-green-700">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">
          Click to manage {title.toLowerCase()}.
        </p>
      </Link>
    </motion.article>
  );
}