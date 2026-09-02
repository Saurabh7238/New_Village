"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, Moon, Sun, Phone } from "lucide-react";
import WeatherBadge from "./WeatherBadge";
import { useLanguage } from "@/app/language-provider";
import { TYPE_LABELS } from "@/lib/notificationConstants";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [visitedLinks, setVisitedLinks] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [serviceNotifications, setServiceNotifications] = useState([]);
  const [serviceUnreadCount, setServiceUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const notificationRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
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
    if (!open) return;

    const closeMenuOutside = (event) => {
      const clickedInsideMenu = menuButtonRef.current?.contains(event.target) || menuPanelRef.current?.contains(event.target);
      if (!clickedInsideMenu) {
        setOpen(false);
        setOpenSubmenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenuOutside);
    return () => document.removeEventListener("mousedown", closeMenuOutside);
  }, [open]);

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
    try {
      const savedVisited = JSON.parse(localStorage.getItem("portal-visited-links") || "[]");
      if (Array.isArray(savedVisited)) {
        setVisitedLinks(savedVisited.filter(Boolean).slice(-20));
      }
    } catch (error) {
      console.warn("Unable to read saved visited links", error);
    }

    setDarkMode(document.documentElement.classList.contains("dark"));
    setLargeText(document.documentElement.classList.contains("text-size-large"));

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

  useEffect(() => {
    try {
      localStorage.setItem("portal-visited-links", JSON.stringify(visitedLinks));
    } catch (error) {
      console.warn("Unable to save visited links", error);
    }
  }, [visitedLinks]);

  const markVisited = (route) => {
    if (!route) return;
    setVisitedLinks((current) => [...new Set([route, ...current])].slice(0, 20));
  };

  const toggleLargeText = () => {
    const nextSize = !largeText;
    setLargeText(nextSize);
    document.documentElement.classList.toggle("text-size-large", nextSize);
    localStorage.setItem("text-size-large", String(nextSize));
  };

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
    ["Emergency Contacts", "/emergency"],
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
    "flex w-full items-center rounded-lg bg-slate-100 px-2.5 py-2.5 text-left text-xs sm:text-sm font-semibold transition-colors dark:bg-slate-700";
  const menuItemActiveClass =
    "bg-emerald-600 text-white dark:bg-emerald-600";
  const menuItemVisitedClass =
    "bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-800/70";
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

  const notificationTypeCounts = ["message", "circular", "order"].reduce((acc, type) => {
    acc[type] = visibleNotifications.filter((item) => (item.type || item.category || "").toLowerCase() === type).length;
    return acc;
  }, { message: 0, circular: 0, order: 0 });

  const notificationTypeStyles = {
    message: {
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
      dot: "bg-blue-600",
    },
    circular: {
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
      dot: "bg-amber-600",
    },
    order: {
      badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
      dot: "bg-violet-600",
    },
  };

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
              src="/favicon .ico"
              alt="Chiutahara Heritage Village logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              className="object-cover"
              priority
            />
          </span>
          <span className="min-w-0 leading-none text-white">
            <span className="block truncate text-sm font-extrabold tracking-wide text-white sm:text-lg">Chiutahara</span>
            <span className="mt-0.5 block truncate text-[10px] font-semibold tracking-[0.2em] text-yellow-200 uppercase sm:text-[11px]">Portal</span>
          </span>
        </Link>

        <div className="relative ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="hidden sm:block"><WeatherBadge /></div>
          <Link
            href="/emergency"
            className="grid h-9 w-9 place-items-center rounded-md bg-red-600 text-white shadow transition hover:scale-105 hover:bg-red-700 sm:h-10 sm:w-auto sm:px-3"
            aria-label="Emergency contacts"
            title="Emergency contacts"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1.5 hidden text-sm font-bold sm:inline">Emergency</span>
          </Link>
          <button
            onClick={toggleLargeText}
            className="grid h-9 w-9 place-items-center rounded-md bg-white text-sm font-bold text-green-700 shadow transition hover:scale-105 sm:h-10 sm:w-10"
            aria-label={largeText ? "Use normal text size" : "Use larger text size"}
            aria-pressed={largeText}
          >
            A+
          </button>
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
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white shadow-sm ring-2 ring-white dark:ring-slate-800">
                  {visibleNotificationCount > 99 ? "99+" : visibleNotificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full z-[60] mt-3 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold dark:border-slate-700">Notifications</div>
                <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                  {Object.entries(notificationTypeCounts).map(([type, count]) => (
                    <span
                      key={type}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${notificationTypeStyles[type]?.badge || "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"}`}
                    >
                      <span>{TYPE_LABELS[type] || type}</span>
                      <span className={`rounded-full px-1.5 text-[9px] text-white ${notificationTypeStyles[type]?.dot || "bg-emerald-600"}`}>
                        {count}
                      </span>
                    </span>
                  ))}
                </div>
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
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate">{note.title}</span>
                          {note.type && (
                            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 dark:bg-slate-600 dark:text-slate-100">
                              {note.type}
                            </span>
                          )}
                        </span>
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
            ref={menuButtonRef}
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
                ref={menuPanelRef}
                id="main-menu"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full mt-2 max-h-[calc(100dvh-8rem)] w-[min(78vw,21rem)] origin-top-right overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
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
                          <div className="mt-1.5 space-y-1.5 pl-2 border-l-2 border-emerald-500">
                            {subItems.map(([subLabel, subHref]) => (
                              <Link
                                key={subHref}
                                href={subHref}
                                className={`${menuItemBaseClass} text-sm ${
                                  pathname === subHref
                                    ? menuItemActiveClass
                                    : visitedLinks.includes(subHref)
                                      ? menuItemVisitedClass
                                      : menuItemInactiveClass
                                }`}
                                onClick={() => {
                                  markVisited(subHref);
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
                            : visitedLinks.includes(href)
                              ? menuItemVisitedClass
                              : menuItemInactiveClass
                        }`}
                        onClick={() => {
                          markVisited(href);
                          setOpen(false);
                        }}
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                  ))}

                  <li>
                    <button
                      onClick={toggleLanguage}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-100 px-2.5 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200"
                    >
                      <span>Language</span>
                      <span className="rounded-lg bg-white px-2 py-1 text-[10px] sm:text-xs font-bold text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300">
                        {langLabels.langToggle}
                      </span>
                    </button>
                  </li>

                  {status === "authenticated" && session ? (
                  <>
                    <li>
                      <Link href="/dashboard" className={`${menuItemBaseClass} ${pathname === "/dashboard" ? menuItemActiveClass : visitedLinks.includes("/dashboard") ? menuItemVisitedClass : menuItemInactiveClass}`} onClick={() => { markVisited("/dashboard"); setOpen(false); }}>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/profile" className={`${menuItemBaseClass} ${pathname === "/dashboard/profile" ? menuItemActiveClass : visitedLinks.includes("/dashboard/profile") ? menuItemVisitedClass : menuItemInactiveClass}`} onClick={() => { markVisited("/dashboard/profile"); setOpen(false); }}>
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
