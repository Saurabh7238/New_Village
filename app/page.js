// /app/HomePage.jsx or /pages/index.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BellRing, ChevronRight, MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
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
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[radial-gradient(circle_at_12%_20%,rgba(110,231,183,.35),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(125,211,252,.32),transparent_28%)] dark:bg-[radial-gradient(circle_at_12%_20%,rgba(6,78,59,.5),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(12,74,110,.45),transparent_28%)]" />
      <div className="relative min-h-screen text-black dark:text-white">
        {/* Notification Banner */}
        {showBanner && (
          <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-lg shadow-amber-950/5 backdrop-blur dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100 sm:items-center sm:px-5">
            <span className="flex items-center gap-2 leading-5"><BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />{t.bannerMessage}</span>
            <button
              onClick={() => setShowBanner(false)}
              className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
            >
              <span className="sr-only">{t.close}</span><X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8 pb-8 transition-colors duration-300 sm:space-y-10">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 px-5 py-10 text-center shadow-[0_24px_80px_-36px_rgba(6,78,59,.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:px-10 sm:py-16 lg:px-16">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-300/35 blur-3xl dark:bg-emerald-700/25" /><div className="absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-800/25" />
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="relative mx-auto max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Digital village services</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-200 sm:text-4xl lg:text-5xl">
              {t.welcome}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              {t.description}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/grievance" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900">Raise a request <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link><Link href="/track" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100">Track your request <ChevronRight className="h-4 w-4" /></Link></div>
            <p className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-600" />Simple, secure access to Panchayat services</p>
            </motion.div>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-slate-950 py-3 text-white shadow-lg shadow-slate-900/10">
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

          <section aria-label="Village highlights" className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/70 p-3 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80 sm:p-4">
            <div className="relative w-full">
              <motion.div
                className="flex gap-3"
                animate={{ x: ["0%", "-100%"] }}
                transition={{ ease: "linear", duration: 20, repeat: Infinity }}
              >
                {[...images, ...images].map((src, idx) => (
                  <Image
                    key={idx}
                    src={src}
                    alt={`Chiutahara village highlight ${idx + 1}`}
                    width={448}
                    height={288}
                    className="h-32 w-52 shrink-0 rounded-2xl object-cover shadow-md transition-transform duration-300 hover:scale-[1.02] sm:h-40 sm:w-64"
                  />
                ))}
              </motion.div>
            </div>
          </section>

          <section id="services" className="py-2 sm:py-4">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Citizen portal</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t.services}
            </h2>
              </div><p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">Choose a service to begin an application, find local information, or track an existing request.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          <section className="rounded-[2rem] border border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white/80 to-emerald-50/90 px-5 py-8 shadow-xl shadow-sky-950/5 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950/40 sm:px-8 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-700 dark:text-sky-300">Our village</p><h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-300 sm:text-3xl">
              📍 About Chiutahara Village
            </h2>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Population (2011 Census)</p>
                <p className="text-2xl font-bold text-blue-600">1,768</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Male: 795 | Female: 973</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Households</p>
                <p className="text-2xl font-bold text-green-600">269</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Code: 195584</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Schools</p>
                <p className="text-2xl font-bold text-purple-600">3</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Education Priority</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Ward Members</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Elected Representatives</p>
              </div>
            </div>

            {/* Gram Panchayat Overview */}
            <div className="mb-4 rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
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
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🏛️ Local Governance</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">Assembly:</span> Lalganj Constituency</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">Parliament:</span> Lalganj Constituency</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">Sub-District:</span> Lalganj</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🗳️ Political Representatives</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">MLA:</span> Shri Bechai Saroj (Samajwadi Party)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">MP:</span> Daroga Prasad Saroj (Samajwadi Party)</p>
              </div>
            </div>

            {/* Cultural Heritage & Famous For */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🙏 Famous For</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Hanuman Mandir</strong> - Sacred temple dedicated to Lord Hanuman (God of Strength). People from nearby and far-off villages visit regularly to worship and offer prayers, especially on special occasions.</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🎨 Cultural Heritage</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Traditional Dress:</strong> Dhoti Kurta<br/><strong>Traditional Food:</strong> Dal Chawal<br/><strong>Traditional Ornaments:</strong> Bichhiya</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">📮 Postal & Location Info</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Pincode:</strong> 276203</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Postal Area Code:</strong> 276123</p>
              </div>
            </div>

            {/* Beliefs & Customs */}
            <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-gray-800/85">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🙌 Beliefs & Customs</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">The community believes that Lord Hanuman protects the village and its people from all harm. Worship at Hanuman Mandir is a regular practice, strengthening the cultural and spiritual fabric of the village.</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/75 px-5 py-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-800/85 sm:px-8 sm:py-10">
            <h2 className="text-center text-2xl font-bold text-green-800 dark:text-yellow-400">
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
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-left shadow-sm dark:border-gray-600 dark:bg-gray-700"
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
              className="mx-auto max-w-xl space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <input
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-emerald-900"
                placeholder={t.reviewName}
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                required
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-emerald-900"
                placeholder={t.reviewWard}
                value={reviewWard}
                onChange={(e) => setReviewWard(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-emerald-900"
                placeholder={t.reviewMessage}
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                rows={3}
                required
              />
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-60"
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

        <section className="rounded-2xl border border-white/70 bg-white/65 py-3 text-center shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/75">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            🔢 {t.visitors}: <span className="font-bold">{visitCount ?? "..."}</span>
          </p>
        </section>

        <button
          onClick={toggleModal}
          aria-label={t.contactTitle}
          className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-700 text-white shadow-xl shadow-emerald-900/25 transition hover:-translate-y-1 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </button>

        <AnimatePresence>{showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="contact-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 10 }} className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 text-black shadow-2xl dark:border-slate-700 dark:bg-gray-900 dark:text-white">
              <h3 id="contact-title" className="text-lg font-bold mb-2">{t.contactTitle}</h3>
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
            </motion.div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </div>
  );
}
