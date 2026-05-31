"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaRoad,
  FaLightbulb,
  FaWater,
  FaSchool,
  FaHospital,
  FaSolarPanel,
  FaWifi,
  FaTractor,
  FaToilet,
  FaStore,
  FaEllipsisH,
} from "react-icons/fa";
import {
  INFRA_HUB_SECTIONS,
  getInfraCategoryByType,
  countByInfraType,
  formatInfraCount,
} from "@/lib/infrastructureDisplay";

const TYPE_ICONS = {
  "Primary Health Center": FaHospital,
  "Primary School": FaSchool,
  "Sanitation Unit": FaToilet,
  "Community Hall": FaStore,
  "Water Pump": FaWater,
  "Water Tank": FaWater,
  "Irrigation Project": FaTractor,
  Road: FaRoad,
  "Street Light": FaLightbulb,
  "Solar Panel": FaSolarPanel,
  "Internet Coverage": FaWifi,
  "River Monitoring": FaWater,
  Other: FaEllipsisH,
};

export default function InfrastructurePage() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    fetch("/api/infrastructure")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load infrastructure");
        return res.json();
      })
      .then((data) => {
        setCounts(countByInfraType(Array.isArray(data) ? data : []));
      })
      .catch((err) => {
        console.error("Failed to fetch infrastructure counts:", err);
        setCounts(countByInfraType([]));
      });
  }, []);

  return (
    <div className="pt-36 max-w-5xl mx-auto px-4">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-green-700 mb-4"
      >
        Village Infrastructure & Development
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-gray-700 mb-6"
      >
        A comprehensive overview of infrastructure and development initiatives under
        the Gram Panchayat&apos;s jurisdiction. All items below can be added and
        updated from the admin panel.
      </motion.p>

      {INFRA_HUB_SECTIONS.map((section, idx) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + idx * 0.15, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-green-600 mb-3">
            {section.title}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.types.map((type) => {
              const category = getInfraCategoryByType(type);
              if (!category) return null;
              const Icon = TYPE_ICONS[type] || FaEllipsisH;
              const count = counts ? counts[type] : null;
              const value =
                count === null ? "Loading…" : formatInfraCount(count);

              return (
                <li key={type}>
                  <Link href={`/infrastructure/${category.slug}`}>
                    <div className="flex items-start gap-3 bg-white rounded-lg shadow p-4 text-gray-700 hover:shadow-md hover:scale-[1.02] transition cursor-pointer h-full">
                      <Icon className="text-green-500 text-xl mt-1 shrink-0" />
                      <div>
                        <p className="font-medium">{category.hubLabel}</p>
                        <p className="text-sm">{value}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </motion.section>
      ))}
    </div>
  );
}
