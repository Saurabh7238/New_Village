// /app/HomePage.jsx or /pages/index.jsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
// Ensure you have this file: ../components/ServiceCard.jsx
import ServiceCard from "../components/ServiceCard"; 
import { useLanguage } from "@/app/language-provider";

export default function HomePage() {
  const { language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [visitCount, setVisitCount] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewWard, setReviewWard] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const toggleModal = () => setShowModal(!showModal);

  const loadReviews = () => {
    fetch("/api/reviews")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
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

  const labels = {
    en: {
      welcome: "Welcome to Gram Panchayat Chiutahara",
      description: "Manage certificates, budget, members, development & more",
      services: "Services",
      lang: "हिंदी",
      dark: "Dark Mode",
      slogan: "Panchayat Vikas, Sarvajan Sukhaya 🌞 | Efficient Governance for Every Citizen",
      footer: "© 2026 Gram Panchayat Chiutahara | Powered by Local Governance",
      fab: "📞",
      whatsappLink:
        "https://wa.me/qr/D5EKI63JQJHLC1?text=Hello%20Gram%20Panchayat%20Team%2C%20I%20have%20a%20query.",
      contactTitle: "Contact Gram Panchayat Chiutahara",
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
    { title: "Raise Query", hindi: "शिकायत दर्ज करें", href: "/grievance" },
    { title: "Track Query", hindi: "शिकायत ट्रैक करें", href: "/track" },
    { title: "Birth Certificates", hindi: "जन्म प्रमाण पत्र", href: "/birth" },
    { title: "Death Certificates", hindi: "मृत्यु प्रमाण पत्र", href: "/death" },
    { title: "Aadhaar Create / Update", hindi: "आधार बनवाएं / अपडेट करें", href: "/aadhar" },
    { title: "Voter List", hindi: "मतदाता सूची", href: "/voter" },
    { title: "Gram Budget", hindi: "ग्राम बजट", href: "/budget" },
    { title: "Panchayat Funds", hindi: "पंचायत निधि", href: "/funds" },
    { title: "Development Projects", hindi: "विकास परियोजनाएं", href: "/development" },
    { title: "Panchayat Members", hindi: "पंचायत सदस्य", href: "/members" },
    { title: "Appointments", hindi: "नियुक्तियां", href: "/appointments" },
    { title: "Gallery", hindi: "गैलरी", href: "/gallery" },
    { title: "Map", hindi: "मानचित्र", href: "/map" },
    { title: "Rivers, Roads & Lights", hindi: "नदियां, सड़कें और लाइटें", href: "/infrastructure" },
  ];

  const images = ["/slide.png", "/voter.png", "/panchayat.jpg"];

  return (
    <div>
      <div className="relative min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white">
        {/* Notification Banner */}
        {showBanner && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100 sm:items-center sm:px-5">
            <span className="leading-5">{t.bannerMessage}</span>
            <button
              onClick={() => setShowBanner(false)}
              className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
            >
              {t.close}
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-5 pb-6 transition-colors duration-300">
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-5 py-8 text-center shadow-sm dark:border-emerald-900/70 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950 sm:px-8 sm:py-10">
            <h1 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300 sm:text-3xl">
              {t.welcome}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {t.description}
            </p>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-slate-900 py-2.5 text-white shadow-sm">
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

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
            <div className="relative w-full">
              <motion.div
                className="flex gap-3"
                animate={{ x: ["0%", "-100%"] }}
                transition={{ ease: "linear", duration: 20, repeat: Infinity }}
              >
                {[...images, ...images].map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Slide ${idx}`}
                    className="h-28 w-44 shrink-0 rounded-2xl object-cover shadow-sm transition-transform duration-300 hover:scale-[1.02] sm:h-36 sm:w-56"
                  />
                ))}
              </motion.div>
            </div>
          </section>

          <section className="py-3 sm:py-5">
            <div className="mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Citizen portal</p>
                <h2 className="mt-1 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.services}
            </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <ServiceCard
                  key={s.href}
                  title={s.title}
                  hindi={s.hindi}
                  href={s.href}
                  index={i}
                />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-emerald-50 px-4 py-6 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-emerald-950/40 sm:px-6 sm:py-8">
            <h2 className="mb-5 text-xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>Gram Panchayat:</strong> Chiutahara</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>Villages Served:</strong> 3</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chiutahara, Lauhara, Malikan</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><strong>Sarpanch:</strong> Chhotelal Yadav</p>
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

          <section className="rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:px-6 sm:py-8">
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

        <section className="rounded-2xl border border-slate-200 bg-slate-50 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            🔢 {t.visitors}: <span className="font-bold">{visitCount ?? "..."}</span>
          </p>
        </section>

        <button
          onClick={toggleModal}
          className="fixed bottom-5 right-4 z-40 rounded-full bg-emerald-600 px-4 py-3 text-lg text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900"
        >
          {t.fab}
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-6 text-black shadow-xl dark:bg-gray-900 dark:text-white">
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
