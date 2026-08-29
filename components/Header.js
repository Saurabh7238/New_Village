"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, Moon, Sun } from "lucide-react";
import logoImage from "../Gemini_Generated_Image_vj7e1vj7e1vj7e1v.png";
import WeatherBadge from "./WeatherBadge";
import { useLanguage } from "@/app/language-provider";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [serviceNotifications, setServiceNotifications] = useState([]);
  const [serviceUnreadCount, setServiceUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const notificationRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
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

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") {
      setServiceNotifications([]);
      setServiceUnreadCount(0);
      return;
    }

    const loadServiceNotifications = () => {
      fetch("/api/service-notifications")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setServiceNotifications(data?.notifications || []);
          setServiceUnreadCount(data?.unread || 0);
        })
        .catch(() => {
          setServiceNotifications([]);
          setServiceUnreadCount(0);
        });
    };

    loadServiceNotifications();
    const interval = setInterval(loadServiceNotifications, 30000);
    return () => clearInterval(interval);
  }, [status, session?.user?.role]);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));

    const loadNotifications = () => {
      fetch("/api/notifications?page=1&limit=5")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const items = Array.isArray(data?.notifications)
            ? data.notifications
            : Array.isArray(data)
              ? data
              : [];
          setNotifications(items);
          setNotificationCount(typeof data?.total === "number" ? data.total : items.length);
        })
        .catch(() => {
          setNotifications([]);
          setNotificationCount(0);
        });
    };

    const closeNotifications = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    loadNotifications();
    const notificationInterval = setInterval(loadNotifications, 30000);
    document.addEventListener("mousedown", closeNotifications);
    return () => {
      clearInterval(notificationInterval);
      document.removeEventListener("mousedown", closeNotifications);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    document.documentElement.classList.toggle("dark", nextMode);
    localStorage.setItem("theme", nextMode ? "dark" : "light");
  };


  const serviceItems = [
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

  const navItems = [
    [langLabels.home, "/"],
    ["Services", null, serviceItems],
  ];

  if (session?.user?.role === "admin") {
    navItems.push(["Admin Panel", "/admin"]);
  }

  const baseClass = "fixed inset-x-0 top-0 z-[100] w-full transition-all duration-300";
  const scrolledClass = scrolled
    ? "bg-green-700/90 dark:bg-green-900/90 backdrop-blur shadow-lg"
    : "bg-gradient-to-r from-green-700 via-green-600 to-green-500 dark:from-green-900 dark:via-green-800 dark:to-green-700";
  const menuItemBaseClass =
    "flex w-full items-center rounded-2xl bg-slate-100 px-5 py-4 text-left text-base font-semibold transition-colors dark:bg-slate-700";
  const menuItemActiveClass =
    "bg-emerald-600 text-white dark:bg-emerald-600";
  const menuItemInactiveClass =
    "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-100 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200";
  const isAuthenticated = status === "authenticated";
  // Service requests are operational alerts for administrators. Keep them on
  // admin pages so a citizen submission never appears in the public/homepage
  // notification dropdown.
  const showServiceNotifications =
    isAuthenticated &&
    session?.user?.role === "admin" &&
    pathname.startsWith("/admin");
  const visibleNotifications = showServiceNotifications
    ? serviceNotifications
    : notifications;
  const visibleNotificationCount = showServiceNotifications
    ? serviceUnreadCount
    : notificationCount;

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

      <div className="mx-auto flex max-w-6xl flex-nowrap items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/90 shadow-md shadow-black/10 ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12">
            <Image
              src={logoImage}
              alt="Chiutahara Heritage Village logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              className="object-cover"
              priority
            />
          </span>
          <span className="min-w-0 leading-tight text-white">
            <span className="block truncate text-base font-bold tracking-wide sm:text-2xl">Chiutahara Portal</span>
          </span>
        </Link>

        <div className="relative ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="hidden sm:block"><WeatherBadge /></div>
          <button
            onClick={toggleDarkMode}
            className="grid h-9 w-9 place-items-center rounded-md bg-white text-green-700 shadow transition hover:scale-105 sm:h-10 sm:w-10"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setOpen(false);
                setShowNotifications((current) => !current);
              }}
              className="relative grid h-9 w-9 place-items-center rounded-md bg-white text-green-700 shadow transition hover:scale-105 sm:h-10 sm:w-10"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {visibleNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
                  {visibleNotificationCount > 99 ? "99+" : visibleNotificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full z-[60] mt-3 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold dark:border-slate-700">Notifications</div>
                <ul className="max-h-72 overflow-y-auto">
                  {visibleNotifications.length > 0 ? visibleNotifications.map((note) => (
                    <li key={note.id}>
                      <button
                        className="w-full px-4 py-3 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
                        onClick={() => {
                          setShowNotifications(false);
                          if (showServiceNotifications && !note.isRead) {
                            fetch("/api/service-notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: note.id }) });
                            setServiceUnreadCount((count) => Math.max(0, count - 1));
                            setServiceNotifications((items) => items.map((item) => item.id === note.id ? { ...item, isRead: true } : item));
                          }
                          router.push(note.link || "/notifications");
                        }}
                      >
                        {note.title}
                      </button>
                    </li>
                  )) : (
                    <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No notifications</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setShowNotifications(false);
              setOpen(!open);
            }}
            className="rounded-md bg-white px-2.5 py-2 text-sm font-semibold whitespace-nowrap text-green-700 shadow transition hover:scale-105 sm:px-4 sm:text-base"
            aria-expanded={open}
            aria-controls="main-menu"
            aria-label={open ? langLabels.close : langLabels.menu}
          >
            {open ? langLabels.close : langLabels.menu}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                id="main-menu"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full mt-3 max-h-[calc(100dvh-8rem)] w-[min(92vw,44rem)] origin-top-right overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:p-4"
              >
                <ul className="space-y-3">
                  {navItems.map(([label, href, subItems]) => (
                  <li key={label}>
                    {subItems ? (
                      // Services dropdown
                      <div>
                        <button
                          onClick={() => setOpenSubmenu(openSubmenu === label ? null : label)}
                          className={`${menuItemBaseClass} justify-between ${
                            openSubmenu === label
                              ? menuItemActiveClass
                              : menuItemInactiveClass
                          }`}
                        >
                          <span>{label}</span>
                          <span className={`transition-transform ${openSubmenu === label ? "rotate-180" : ""}`}>▼</span>
                        </button>
                        {openSubmenu === label && (
                          <div className="mt-2 space-y-2 pl-2 border-l-2 border-emerald-500">
                            {subItems.map(([subLabel, subHref]) => (
                              <Link
                                key={subHref}
                                href={subHref}
                                className={`${menuItemBaseClass} text-sm ${
                                  pathname === subHref
                                    ? menuItemActiveClass
                                    : menuItemInactiveClass
                                }`}
                                onClick={() => {
                                  setOpen(false);
                                  setOpenSubmenu(null);
                                }}
                              >
                                {subLabel}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular menu items
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
                    )}
                  </li>
                  ))}

                  <li>
                    <button
                      onClick={toggleLanguage}
                      className="flex w-full items-center justify-between rounded-2xl bg-slate-100 px-5 py-4 text-left text-base font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200"
                    >
                      <span>Language</span>
                      <span className="rounded-xl bg-white px-4 py-1.5 text-sm font-bold text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300">
                        {langLabels.langToggle}
                      </span>
                    </button>
                  </li>

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
                    <li className="rounded-2xl bg-slate-100 px-5 py-4 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-100">
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
                  <li className="flex gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-700">
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
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
