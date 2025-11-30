// /app/HomePage.jsx or /pages/index.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
// Ensure you have this file: ../components/ServiceCard.jsx
import ServiceCard from "../components/ServiceCard"; 
import { Globe, Moon, Sun, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [language, setLanguage] = useState("hi");
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visitCount, setVisitCount] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const toggleLanguage = () => setLanguage(language === "en" ? "hi" : "en");
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleModal = () => setShowModal(!showModal);
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  // Visitor count API: Runs once on component mount
  useEffect(() => {
    fetch("/api/visit")
      .then((res) => res.json())
      .then((data) => setVisitCount(data.count))
      .catch(() => setVisitCount(0));
  }, []);

  // Notifications API: Runs once on component mount
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => {
        if (!res.ok) throw new Error("Bad response");
        return res.json();
      })
      .then((data) => setNotifications(data))
      .catch((err) => {
        console.error(err);
        setNotifications([]);
      });
  }, []);

  // Dark mode toggle: Runs when darkMode state changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Close dropdown if clicked outside: Runs once on mount
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const labels = {
    en: {
      welcome: "Welcome to Gram Panchayat Portal",
      description: "Manage certificates, budget, members, development & more",
      services: "Services",
      lang: "हिंदी",
      dark: "Dark Mode",
      slogan: "Panchayat Vikas, Sarvajan Sukhaya 🌞 | Efficient Governance for Every Citizen",
      footer: "© 2025 Gram Panchayat | Powered by Local Governance",
      fab: "📞",
      whatsappLink:
        "https://wa.me/qr/D5EKI63JQJHLC1?text=Hello%20Gram%20Panchayat%20Team%2C%20I%20have%20a%20query.",
      contactTitle: "Contact Gram Panchayat",
      contactMessage: "Send us a message or reach out via WhatsApp.",
      close: "Close",
      whatsapp: "Open WhatsApp",
      call: "Call Now",
      visitors: "Total Visitors",
      bannerMessage: "📢 Special Gram Sabha will be held on September 25 at Panchayat Bhavan.",
      notificationsTitle: "Notifications",
      noNotifications: "No notifications",
    },
    hi: {
      welcome: "ग्राम पंचायत पोर्टल में आपका स्वागत है",
      description: "प्रमाणपत्र, बजट, सदस्य, विकास और अधिक प्रकाशित करें",
      services: "सेवाएं",
      lang: "English",
      dark: "डार्क मोड",
      slogan: "पंचायत विकास, सर्वजन सुखाय 🌞 | Efficient Governance For Every Citizen",
      footer: "© 2025 ग्राम पंचायत | स्थानीय शासन द्वारा संचालित",
      fab: "📞",
      whatsappLink:
        "https://wa.me/qr/D5EKI63JQJHLC1?text=नमस्ते%20ग्राम%20पंचायत%20टीम%2C%20मुझे%20एक%20सवाल%20है।",
      contactTitle: "संपर्क करें",
      contactMessage: "हमें संदेश भेजें या WhatsApp से जुड़ें।",
      close: "बंद करें",
      whatsapp: "WhatsApp खोलें",
      call: "कॉल करें",
      visitors: "कुल विज़िटर",
      bannerMessage: "📢 पंचायत भवन में 25 सितंबर को विशेष ग्रामसभा आयोजित की जाएगी।",
      notificationsTitle: "सूचनाएँ",
      noNotifications: "कोई सूचनाएँ नहीं",
    },
  };

  const t = labels[language];

  const services = [
    { title: "Birth Certificates", href: "/birth" },
    { title: "Death Certificates", href: "/death" },
    { title: "Aadhar Create / Update", href: "/aadhar" },
    { title: "Voter List", href: "/voter" },
    { title: "Gram Budget", href: "/budget" },
    { title: "Development Projects", href: "/development" },
    { title: "Panchayat Members", href: "/members" },
    { title: "Appointments", href: "/appointments" },
    { title: "Gallery", href: "/gallery" },
    { title: "Map", href: "/map" },
    { title: "Rivers, Roads & Lights", href: "/infrastructure" },
  ];

  const images = ["/slide.png", "/voter.png", "/panchayat.jpg"];

  // Dynamic padding-top for main content to avoid overlap with fixed banner
  const mainContentPaddingTop = showBanner ? 'pt-16' : 'pt-4'; 
  // Dynamic top position for fixed icons to appear below the banner
  const fixedIconsTop = showBanner ? 'top-12' : 'top-2'; 
  // Top padding for the whole page when banner is active to push content down
  const wrapperPaddingTop = showBanner ? 'pt-12' : 'pt-0'; 

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
        } relative ${wrapperPaddingTop}`} // Use wrapperPaddingTop to push content down
      >
        {/* Notification Banner */}
        {showBanner && (
          <div className="bg-yellow-100 dark:bg-yellow-700 text-black dark:text-white text-sm px-4 py-2 flex justify-between items-center fixed top-0 left-0 right-0 z-50 shadow-md">
            <span>{t.bannerMessage}</span>
            <button
              onClick={() => setShowBanner(false)}
              className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              {t.close}
            </button>
          </div>
        )}

        {/* Top-right icons */}
        <div className={`fixed z-[60] right-2 flex gap-2 transition-all duration-300 ${fixedIconsTop}`}>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow"
              title={t.notificationsTitle}
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                {notifications.length}
              </span>
            )}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-2 text-sm font-bold border-b border-gray-200 dark:border-gray-700">
                  {t.notificationsTitle}
                </div>
                <ul>
                  {notifications.length > 0 ? (
                    notifications.map((note) => (
                      <li
                        key={note.id}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                        onClick={() =>
                          router.push(note.link || "/notifications")
                        }
                      >
                        {note.title}
                      </li>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      {t.noNotifications}
                    </div>
                  )}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={toggleLanguage}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow"
            title={t.lang}
          >
            <Globe className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow"
            title={t.dark}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className={`pb-16 transition-all duration-500 ${mainContentPaddingTop}`}>
          <section className="text-center py-2 bg-gradient-to-r from-green-100 via-blue-100 to-yellow-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600">
            <h1 className="text-xl font-bold text-green-700 dark:text-yellow-400">
              {t.welcome}
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t.description}
            </p>
          </section>

          <section className="overflow-hidden relative bg-black text-white py-2">
            <motion.div
              className="whitespace-nowrap"
              animate={{ x: ["100%", "-100%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
            >
              <p className="inline-block text-sm font-medium tracking-wide px-4">
                {t.slogan}
              </p>
            </motion.div>
          </section>

          <section className="py-2 overflow-hidden bg-white dark:bg-gray-800">
            <div className="relative w-full">
              <motion.div
                className="flex gap-4"
                animate={{ x: ["0%", "-100%"] }}
                transition={{ ease: "linear", duration: 20, repeat: Infinity }}
              >
                {[...images, ...images].map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Slide ${idx}`}
                    className="rounded-md shadow-sm hover:scale-105 transition h-24"
                  />
                ))}
              </motion.div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-2 py-4">
            <h2 className="text-lg font-bold text-center mb-3 text-green-700 dark:text-yellow-400">
              {t.services}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {services.map((s, i) => (
                <ServiceCard
                  key={s.href}
                  title={s.title}
                  href={s.href}
                  index={i}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="text-center py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            🔢 {t.visitors}: <span className="font-bold">{visitCount ?? "..."}</span>
          </p>
        </section>

        <footer className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 text-center text-xs py-2 border-t border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
          {t.footer}{" "}
          <span className="text-[10px] ml-2">Powered by Saurabh</span>
        </footer>

        <button
          onClick={toggleModal}
          className="fixed bottom-16 right-4 bg-green-500 hover:bg-green-600 text-white text-lg px-4 py-2 rounded-full shadow-lg transition animate-pulse"
        >
          {t.fab}
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg p-6 w-80 shadow-xl">
              <h3 className="text-lg font-bold mb-2">{t.contactTitle}</h3>
              <p className="text-sm mb-4">{t.contactMessage}</p>
              <div className="flex justify-end gap-2">
                <a
                  href={t.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 transition"
                >
                  {t.whatsapp}
                </a>
                <a
                  href="tel:+919336401640"
                  className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  {t.call}
                </a>
                <button
                  onClick={toggleModal}
                  className="px-3 py-1 text-sm rounded bg-gray-300 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}