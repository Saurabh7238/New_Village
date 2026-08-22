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
    "flex w-full items-center border-b border-green-100 bg-green-50 px-5 py-3 text-left text-sm font-medium transition-colors dark:border-green-700 dark:bg-gray-900";
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

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/90 shadow-md shadow-black/10 ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12">
            <Image
              src={logoImage}
              alt="Chhiutahara Heritage Village logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              className="object-cover"
              priority
            />
          </span>
          <span className="min-w-0 leading-tight text-white">
            <span className="block truncate text-lg font-bold tracking-wide sm:text-2xl">Chiutahara Portal</span>
          </span>
        </Link>

        <div className="relative ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <WeatherBadge />
          <button
            onClick={toggleLanguage}
            className="rounded-md bg-white px-2.5 py-2 font-semibold whitespace-nowrap text-green-700 shadow transition hover:scale-105 sm:px-3"
            aria-label="Toggle language"
          >
            {langLabels.langToggle}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md bg-white px-3 py-2 font-semibold whitespace-nowrap text-green-700 shadow transition hover:scale-105 sm:px-4"
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
                className="absolute right-0 top-full mt-3 max-h-[calc(100dvh-8rem)] w-[min(95vw,18rem)] max-w-full origin-top-right overflow-y-auto overscroll-contain rounded-md bg-white shadow-lg dark:bg-gray-800"
                onMouseLeave={() => setOpen(false)}
              >
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

                {status === "authenticated" && session ? (
                  <>
                    <li>
                      <Link href="/dashboard" className={`${menuItemBaseClass} ${menuItemInactiveClass}`} onClick={() => setOpen(false)}>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/profile" className={`${menuItemBaseClass} ${menuItemInactiveClass}`} onClick={() => setOpen(false)}>
                        My Profile
                      </Link>
                    </li>
                    <li className="border-y border-green-100 bg-green-50 px-5 py-3 text-sm font-medium text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
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
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <li className="flex gap-2 border-t border-green-100 bg-green-50 p-3 dark:border-green-700 dark:bg-green-950/60">
                    <Link
                      href="/signin?callbackUrl=/"
                      className="flex flex-1 items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-100 dark:bg-gray-900 dark:text-green-100 dark:hover:bg-green-800"
                      onClick={() => setOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      className="flex flex-1 items-center justify-center rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
                      onClick={() => setOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
