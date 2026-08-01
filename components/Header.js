"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import logoImage from "../Gemini_Generated_Image_vj7e1vj7e1vj7e1v.png";
import WeatherBadge from "./WeatherBadge";
import { useLanguage } from "@/app/language-provider";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { labels: langLabels, toggleLanguage } = useLanguage();

  const displayName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    session?.user?.role ||
    null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const navItems = [
    [langLabels.home, "/"],
    [langLabels.birth, "/birth"],
    [langLabels.death, "/death"],
    [langLabels.aadhar, "/aadhar"],
    [langLabels.voter, "/voter"],
    [langLabels.budget, "/budget"],
    [langLabels.funds, "/funds"],
    [langLabels.development, "/development"],
    [langLabels.members, "/members"],
    [langLabels.appointments, "/appointments"],
    [langLabels.gallery, "/gallery"],
    [langLabels.map, "/map"],
    [langLabels.infra, "/infrastructure"],
  ];

  if (session?.user?.role === "admin") {
    navItems.push(["Admin Panel", "/admin"]);
  }

  const baseClass = "fixed top-0 left-0 w-full z-50 transition-all duration-300";
  const scrolledClass = scrolled
    ? "bg-green-700/90 dark:bg-green-900/90 backdrop-blur shadow-lg"
    : "bg-gradient-to-r from-green-700 via-green-600 to-green-500 dark:from-green-900 dark:via-green-800 dark:to-green-700";
  const menuItemBaseClass =
    "flex w-full items-center border-b border-green-100 bg-green-50 dark:border-green-700 dark:bg-gray-900 px-5 py-3 text-sm font-medium transition-colors text-left last:border-b-0";
  const menuItemActiveClass =
    "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 font-semibold";
  const menuItemInactiveClass =
    "text-green-700 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-800";

  return (
    <header className={`${baseClass} ${scrolledClass}`}>
      <div className="bg-green-600 dark:bg-green-800 overflow-hidden">
        <motion.div
          className="py-2 sm:py-3 text-sm font-semibold tracking-wide whitespace-nowrap text-white"
          animate={{ x: ["100%", "-100%"] }}
          transition={{
            ease: "linear",
            duration: 15,
            repeat: Infinity,
          }}
        >
          🌟 Welcome to Chiutahara Portal — Efficient Governance for Every Citizen 🌟
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 py-4">
        <Link href="/" className="flex items-center gap-3 group min-w-0">
          <span className="relative h-12 w-12 overflow-hidden rounded-full border border-white/30 bg-white/90 shadow-md shadow-black/10 ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105">
            <Image
              src={logoImage}
              alt="Chhiutahara Heritage Village logo"
              fill
              sizes="48px"
              className="object-cover"
              priority
            />
          </span>
          <span className="min-w-0 leading-tight text-white">
            <span className="truncate text-2xl font-bold tracking-wide">Chiutahara Portal</span>
          </span>
        </Link>

        <div className="relative ml-auto flex items-center gap-2 md:gap-3 shrink-0">
          <WeatherBadge />
          <button
            onClick={toggleLanguage}
            className="px-3 py-2 bg-white text-green-700 rounded-md shadow hover:scale-105 transition font-semibold whitespace-nowrap"
            aria-label="Toggle language"
          >
            {langLabels.langToggle}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 bg-white text-green-700 rounded-md shadow hover:scale-105 transition font-semibold whitespace-nowrap"
            aria-expanded={open}
            aria-controls="main-menu"
            aria-label={open ? langLabels.close : langLabels.menu}
          >
            {open ? langLabels.close : langLabels.menu}
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                id="main-menu"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full mt-3 w-[min(95vw,18rem)] max-w-full bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden origin-top-right"
                onMouseLeave={() => setOpen(false)}
              >
                {session ? (
                  <>
                    <li className="bg-green-50 px-5 py-3 text-sm font-medium text-green-900 dark:bg-green-950 dark:text-green-100">
                      Logged in as {displayName}
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/?logout=true" });
                          setOpen(false);
                        }}
                        className={`${menuItemBaseClass} ${menuItemInactiveClass}`}
                      >
                        Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <li className="border-b border-green-100 bg-green-50/70 px-3 py-3 dark:border-green-700 dark:bg-green-950/60">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-700 dark:text-green-100">
                      <Link
                        href="/register"
                        className="rounded px-2 py-1 transition hover:bg-green-100 dark:hover:bg-green-900"
                        onClick={() => setOpen(false)}
                      >
                        Sign Up
                      </Link>
                      <span className="text-green-500">/</span>
                      <Link
                        href="/signin?callbackUrl=/"
                        className="rounded px-2 py-1 transition hover:bg-green-100 dark:hover:bg-green-900"
                        onClick={() => setOpen(false)}
                      >
                        Log In
                      </Link>
                    </div>
                  </li>
                )}

                {navItems.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`${menuItemBaseClass} ${
                        pathname === href
                          ? menuItemActiveClass
                          : menuItemInactiveClass
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
