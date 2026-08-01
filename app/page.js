// /app/HomePage.jsx or /pages/index.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
// Ensure you have this file: ../components/ServiceCard.jsx
import ServiceCard from "../components/ServiceCard"; 
import { Globe, Moon, Sun, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/language-provider";

export default function HomePage() {
  const router = useRouter();

  const { language } = useLanguage();
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visitCount, setVisitCount] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewWard, setReviewWard] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleModal = () => setShowModal(!showModal);
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const loadReviews = () => {
    fetch("/api/reviews")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  };

  const loadNotifications = () => {
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("limit", "5");

    fetch(`/api/notifications?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setNotifications([]);
          setNotificationCount(0);
          return;
        }

        const items = Array.isArray(data.notifications)
          ? data.notifications
          : Array.isArray(data)
            ? data
            : [];

        setNotifications(items);
        setNotificationCount(typeof data.total === "number" ? data.total : items.length);
      })
      .catch(() => {
        setNotifications([]);
        setNotificationCount(0);
      });
  };

  // Visitor count: record once per browser session, then poll count
  useEffect(() => {
    const recordVisit = async () => {
      try {
        const alreadyVisited = sessionStorage.getItem("gp_visit_recorded");
        if (!alreadyVisited) {
          const res = await fetch("/api/visit", { method: "POST" });
          const data = await res.json();
          setVisitCount(data.count ?? 0);
          sessionStorage.setItem("gp_visit_recorded", "1");
        } else {
          const res = await fetch("/api/visit");
          const data = await res.json();
          setVisitCount(data.count ?? 0);
        }
      } catch {
        setVisitCount(0);
      }
    };

    recordVisit();
    const visitInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/visit");
        const data = await res.json();
        setVisitCount(data.count ?? 0);
      } catch {
        /* keep last count */
      }
    }, 30000);

    return () => clearInterval(visitInterval);
  }, []);

  // Notifications API: load on mount and refresh periodically so new admin posts appear
  useEffect(() => {
    loadNotifications();
    const notificationInterval = setInterval(loadNotifications, 30000);
    return () => clearInterval(notificationInterval);
  }, []);

  // Reviews: load on mount and refresh every 15s for real-time updates
  useEffect(() => {
    loadReviews();
    const reviewInterval = setInterval(loadReviews, 15000);
    return () => clearInterval(reviewInterval);
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewMessage.trim()) return;

    setReviewSubmitting(true);
    setReviewFeedback("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reviewName,
          ward: reviewWard,
          message: reviewMessage,
        }),
      });

      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => [newReview, ...prev.filter((r) => r.id !== newReview.id)]);
        setReviewName("");
        setReviewWard("");
        setReviewMessage("");
        setReviewFeedback(t.reviewSuccess);
      } else {
        setReviewFeedback(t.reviewError);
      }
    } catch {
      setReviewFeedback(t.reviewError);
    } finally {
      setReviewSubmitting(false);
    }
  };

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
      footer: "© 2026 Gram Panchayat | Powered by Local Governance",
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
      reviewsTitle: "Citizen Reviews",
      reviewsSubtitle: "What people say about our portal",
      reviewName: "Your name",
      reviewWard: "Ward (optional)",
      reviewMessage: "Your review",
      reviewSubmit: "Submit Review",
      reviewSuccess: "Thank you! Your review is live.",
      reviewError: "Could not submit review. Please try again.",
      noReviews: "No reviews yet. Be the first to share!",
    },
    hi: {
      welcome: "ग्राम पंचायत पोर्टल में आपका स्वागत है",
      description: "प्रमाणपत्र, बजट, सदस्य, विकास और अधिक प्रकाशित करें",
      services: "सेवाएं",
      lang: "English",
      dark: "डार्क मोड",
      slogan: "पंचायत विकास, सर्वजन सुखाय 🌞 | Efficient Governance For Every Citizen",
      footer: "© 2026 ग्राम पंचायत | स्थानीय शासन द्वारा संचालित",
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
      reviewsTitle: "नागरिक समीक्षाएँ",
      reviewsSubtitle: "लोग हमारे पोर्टल के बारे में क्या कहते हैं",
      reviewName: "आपका नाम",
      reviewWard: "वार्ड (वैकल्पिक)",
      reviewMessage: "आपकी समीक्षा",
      reviewSubmit: "समीक्षा भेजें",
      reviewSuccess: "धन्यवाद! आपकी समीक्षा प्रकाशित हो गई।",
      reviewError: "समीक्षा भेज नहीं सकी। कृपया पुनः प्रयास करें।",
      noReviews: "अभी कोई समीक्षा नहीं। पहले अपना अनुभव साझा करें!",
    },
  };

  const t = labels[language];

  const services = [
    { title: "Raise Query / शिकायत दर्ज", href: "/grievance" },
    { title: "Track Query / शिकायत ट्रैक करें", href: "/track" },
    { title: "Birth Certificates", href: "/birth" },
    { title: "Death Certificates", href: "/death" },
    { title: "Aadhar Create / Update", href: "/aadhar" },
    { title: "Voter List", href: "/voter" },
    { title: "Gram Budget", href: "/budget" },
    { title: "Panchayat Funds", href: "/funds" },
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
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                {notificationCount}
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

          <section className="max-w-6xl mx-auto px-2 py-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-blue-200 dark:border-gray-600 shadow-sm">
            <h2 className="text-lg font-bold text-center mb-4 text-green-700 dark:text-yellow-400">
              📍 About Chiutahara Village
            </h2>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Population (2011 Census)</p>
                <p className="text-2xl font-bold text-blue-600">1,768</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Male: 795 | Female: 973</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Households</p>
                <p className="text-2xl font-bold text-green-600">269</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Code: 195584</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Schools</p>
                <p className="text-2xl font-bold text-purple-600">3</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Education Priority</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Ward Members</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Elected Representatives</p>
              </div>
            </div>

            {/* Gram Panchayat Overview */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-indigo-500 mb-4">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🏘️ Gram Panchayat Overview</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>State:</strong> Uttar Pradesh</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>District:</strong> Azamgarh</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>Block:</strong> Lalganj</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>Gram Panchayat:</strong> Chiutahra</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>Villages Served:</strong> 3</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chiutahara, Lauhara, Malikan</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><strong>Sarpanch:</strong> </p>
              <p className="text-xs text-gray-600 dark:text-gray-400"><em>Part of Panchayati Raj system, working at grassroots level for local administrative matters and village-level planning.</em></p>
            </div>

            {/* Governance & Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🏛️ Local Governance</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">Assembly:</span> Lalganj Constituency</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">Parliament:</span> Lalganj Constituency</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">Sub-District:</span> Lalganj</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🗳️ Political Representatives</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">MLA:</span> Shri Bechai Saroj (Samajwadi Party)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">MP:</span> Daroga Prasad Saroj (Samajwadi Party)</p>
              </div>
            </div>

            {/* Cultural Heritage & Famous For */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🙏 Famous For</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Hanuman Mandir</strong> - Sacred temple dedicated to Lord Hanuman (God of Strength). People from nearby and far-off villages visit regularly to worship and offer prayers, especially on special occasions.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🎨 Cultural Heritage</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Traditional Dress:</strong> Dhoti Kurta<br/><strong>Traditional Food:</strong> Dal Chawal<br/><strong>Traditional Ornaments:</strong> Bichhiya</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">📮 Postal & Location Info</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Pincode:</strong> 276203</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Postal Area Code:</strong> 276123</p>
              </div>
            </div>

            {/* Beliefs & Customs */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🙌 Beliefs & Customs</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">The community believes that Lord Hanuman protects the village and its people from all harm. Worship at Hanuman Mandir is a regular practice, strengthening the cultural and spiritual fabric of the village.</p>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-2 py-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-center text-green-700 dark:text-yellow-400">
              {t.reviewsTitle}
            </h2>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t.reviewsSubtitle}
            </p>

            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {reviews.map((review) => (
                  <blockquote
                    key={review.id}
                    className="bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600 rounded-lg p-4 text-left shadow-sm"
                  >
                    <p className="text-sm italic text-gray-800 dark:text-gray-200">
                      &ldquo;{review.message}&rdquo;
                    </p>
                    <footer className="mt-2 text-xs font-semibold text-green-700 dark:text-yellow-400">
                      — {review.name}
                      {review.ward ? `, ${review.ward}` : ""}
                    </footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t.noReviews}
              </p>
            )}

            <form
              onSubmit={submitReview}
              className="max-w-xl mx-auto space-y-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
            >
              <input
                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                placeholder={t.reviewName}
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                required
              />
              <input
                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                placeholder={t.reviewWard}
                value={reviewWard}
                onChange={(e) => setReviewWard(e.target.value)}
              />
              <textarea
                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                placeholder={t.reviewMessage}
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                rows={3}
                required
              />
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60 text-sm"
              >
                {reviewSubmitting ? "..." : t.reviewSubmit}
              </button>
              {reviewFeedback && (
                <p className="text-xs text-center text-green-700 dark:text-yellow-400">
                  {reviewFeedback}
                </p>
              )}
            </form>
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