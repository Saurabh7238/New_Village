"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSession, signOut, signIn } from "next-auth/react";
import logoImage from "../Gemini_Generated_Image_vj7e1vj7e1vj7e1v.png";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    ["Home", "/"],
    ["Birth", "/birth"],
    ["Death", "/death"],
    ["Aadhar", "/aadhar"],
    ["Voter", "/voter"],
    ["Budget", "/budget"],
    ["Funds", "/funds"],
    ["Development", "/development"],
    ["Members", "/members"],
    ["Appointments", "/appointments"],
    ["Gallery", "/gallery"],
    ["Map", "/map"],
    ["Infra", "/infrastructure"],
  ];

  if (session?.user?.role === "admin") {
    navItems.push(["Admin Panel", "/admin"]);
  }

  const baseClass = "fixed top-0 left-0 w-full z-50 transition-all duration-300";
  const scrolledClass = scrolled
    ? "bg-green-700/90 dark:bg-green-900/90 backdrop-blur shadow-lg"
    : "bg-gradient-to-r from-green-700 via-green-600 to-green-500 dark:from-green-900 dark:via-green-800 dark:to-green-700";

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
          🌟 Welcome to Gram Panchayat Portal — Efficient Governance for Every Citizen 🌟
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 flex flex-wrap items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 group">
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
          <span className="flex flex-col leading-tight text-white">
            <span className="text-2xl font-bold tracking-wide">Gram Panchayat</span>
            <span className="text-sm text-green-100">Portal</span>
          </span>
        </Link>

        <div className="relative flex items-center gap-3 md:gap-5">
          {status === "loading" ? (
            <div className="text-white text-sm">Loading...</div>
          ) : session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition font-semibold"
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition font-semibold"
              >
                Register
              </Link>
              <button
                onClick={() => signIn("credentials", { callbackUrl: "/admin" })}
                className="px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600 transition font-semibold"
              >
                Sign In
              </button>
            </>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 bg-white text-green-700 rounded-md shadow hover:scale-105 transition font-semibold"
            aria-expanded={open}
            aria-controls="main-menu"
          >
            {open ? "✕ Close" : "☰ Menu"}
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                id="main-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden"
                onMouseLeave={() => setOpen(false)}
              >
                {navItems.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block px-5 py-3 transition ${
                        pathname === href
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold"
                          : "text-green-700 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900"
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
