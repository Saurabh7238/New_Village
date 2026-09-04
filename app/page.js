// /app/HomePage.jsx or /pages/index.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BellRing, BadgeCheck, ChevronRight, FileText, HelpCircle, MessageCircle, Phone, ShieldCheck, Sparkles, X } from "lucide-react";
// Ensure you have this file: ../components/ServiceCard.jsx
import ServiceCard from "../components/ServiceCard"; 
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { useLanguage } from "@/app/language-provider";
import { sanitizePublicReviews } from "@/lib/reviewVisibility";

const DEFAULT_SLIDES = [
  { title: "Village Services", imageUrl: "/slide.png", alt: "Village services banner", href: "/grievance" },
  { title: "Voter Services", imageUrl: "/voter.png", alt: "Voter services banner", href: "/voter" },
  { title: "Panchayat Campus", imageUrl: "/panchayat.jpg", alt: "Panchayat campus banner", href: "/about" },
];

export default function HomePage() {
  const { language } = useLanguage();
  const { status: authStatus } = useSession();
  const [visitCount, setVisitCount] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [homeSettingsLoaded, setHomeSettingsLoaded] = useState(false);
  const [homeSettings, setHomeSettings] = useState({
    popupEnabled: true,
    popupTitle: "Important Update",
    popupMessage: "Gram Sabha will be held on the scheduled date at the Panchayat Bhavan.",
    popupLink: "",
    slides: DEFAULT_SLIDES,
  });
  const [reviews, setReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewReasons, setReviewReasons] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);

  const loadReviews = () => {
    fetch("/api/reviews")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReviews(sanitizePublicReviews(Array.isArray(data) ? data : [])))
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

  useEffect(() => {
    const loadHomeSettings = async () => {
      try {
        const res = await fetch("/api/admin/home-settings");
        if (!res.ok) return;
        const data = await res.json();
        if (data.settings) {
          setHomeSettings({
            popupEnabled: Boolean(data.settings.popupEnabled),
            popupTitle: data.settings.popupTitle || "Important Update",
            popupMessage: data.settings.popupMessage || "Gram Sabha will be held on the scheduled date at the Panchayat Bhavan.",
            popupLink: data.settings.popupLink || "",
            slides: Array.isArray(data.settings.slides) && data.settings.slides.length
              ? data.settings.slides
              : DEFAULT_SLIDES,
          });
          setShowBanner(Boolean(data.settings.popupEnabled));
        }
      } catch (error) {
        console.error("Failed to load home settings:", error);
      } finally {
        setHomeSettingsLoaded(true);
      }
    };

    loadHomeSettings();
  }, []);

  // Reviews: load on mount and refresh every 15s for real-time updates
  useEffect(() => {
    loadReviews();
    const reviewInterval = setInterval(loadReviews, 15000);
    return () => clearInterval(reviewInterval);
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;

    const carouselInterval = setInterval(() => {
      setActiveReviewIndex((current) => (current + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(carouselInterval);
  }, [reviews.length]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (authStatus !== "authenticated") {
      setReviewFeedback("Please login first to submit your review.");
      setShowLoginWarning(true);
      return;
    }
    if (!reviewMessage.trim() && reviewReasons.length === 0) return;

    setReviewSubmitting(true);
    setReviewFeedback("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: reviewMessage,
          rating: reviewRating,
          reasons: reviewReasons,
        }),
      });

      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => sanitizePublicReviews([newReview, ...prev.filter((r) => r.id !== newReview.id)]));
        setReviewMessage("");
        setReviewRating(5);
        setReviewReasons([]);
        setReviewFeedback("Thank you. Your review is waiting for admin approval.");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setReviewFeedback(errorData.message || t.reviewError);
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
      reviewLogin: "Sign in to submit a review",
      reviewRating: "Rating",
      reviewReasons: "What went well or needs improvement?",
      reviewMessage: "Your review",
      reviewSubmit: "Submit Review",
      reviewSuccess: "Thank you. Your review is waiting for admin approval.",
      reviewError: "Could not submit review. Please try again.",
      noReviews: "No reviews yet. Be the first to share!",
      village: "Our village",
      villageAbout: "About Chiutahara Village",
      population: "Population (2011 Census)", households: "Households", schools: "Schools", wardMembers: "Ward Members",
      male: "Male", female: "Female", educationPriority: "Education Priority", electedRepresentatives: "Elected Representatives",
      overview: "Gram Panchayat Overview", state: "State", district: "District", block: "Block", gramPanchayat: "Gram Panchayat", villagesServed: "Villages Served", sarpanch: "Sarpanch",
      localGovernance: "Local Governance", assembly: "Assembly", parliament: "Parliament", subDistrict: "Sub-District", politicalRepresentatives: "Political Representatives", mla: "MLA", mp: "MP",
      villageDescription: "Part of the Panchayati Raj system, working at grassroots level for local administrative matters and village-level planning.",
      famousFor: "Famous For", culturalHeritage: "Cultural Heritage", postalLocation: "Postal & Location Info", beliefsCustoms: "Beliefs & Customs",
      templeDescription: "Sacred temple dedicated to Lord Hanuman (God of Strength). People from nearby and far-off villages visit regularly to worship and offer prayers, especially on special occasions.",
      traditionalDress: "Traditional Dress", traditionalFood: "Traditional Food", traditionalOrnaments: "Traditional Ornaments", pincode: "Pincode", postalAreaCode: "Postal Area Code",
      beliefsDescription: "The community believes that Lord Hanuman protects the village and its people from all harm. Worship at Hanuman Mandir is a regular practice, strengthening the cultural and spiritual fabric of the village.",
      publicInfoTitle: "Free Public Information",
      publicInfoSubtitle: "Helpful resources for every citizen, without any charge.",
      publicInfoBadge: "Free for everyone",
      publicInfoCards: [
        { title: "Public Notices", text: "Latest updates, festival alerts and village announcements.", tag: "Latest", href: "/notices" },
        { title: "Download Forms", text: "Certificates, grievance forms and common application documents.", tag: "Quick access", href: "/downloads" },
        { title: "Emergency Contacts", text: "Panchayat, police, fire and support numbers in one place.", tag: "Need help", href: "/emergency" },
        { title: "Status & Support", text: "Track requests and find the right assistance quickly.", tag: "Support", href: "/track" },
      ],
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
      reviewLogin: "समीक्षा भेजने के लिए लॉग इन करें",
      reviewRating: "रेटिंग",
      reviewReasons: "क्या अच्छा रहा या सुधार की जरूरत है?",
      reviewMessage: "आपकी समीक्षा",
      reviewSubmit: "समीक्षा भेजें",
      reviewSuccess: "धन्यवाद! आपकी समीक्षा व्यवस्थापक की स्वीकृति की प्रतीक्षा कर रही है।",
      reviewError: "समीक्षा भेज नहीं सकी। कृपया पुनः प्रयास करें।",
      noReviews: "अभी कोई समीक्षा नहीं। पहले अपना अनुभव साझा करें!",
      village: "हमारा गांव",
      villageAbout: "चिउटहरा गांव के बारे में",
      population: "जनसंख्या (2011 जनगणना)", households: "परिवार", schools: "विद्यालय", wardMembers: "वार्ड सदस्य",
      male: "पुरुष", female: "महिला", educationPriority: "शिक्षा प्राथमिकता", electedRepresentatives: "निर्वाचित प्रतिनिधि",
      overview: "ग्राम पंचायत का परिचय", state: "राज्य", district: "जिला", block: "ब्लॉक", gramPanchayat: "ग्राम पंचायत", villagesServed: "सेवा प्राप्त गांव", sarpanch: "सरपंच",
      localGovernance: "स्थानीय शासन", assembly: "विधानसभा", parliament: "संसद", subDistrict: "तहसील", politicalRepresentatives: "राजनीतिक प्रतिनिधि", mla: "विधायक", mp: "सांसद",
      villageDescription: "पंचायती राज व्यवस्था का हिस्सा, जो स्थानीय प्रशासनिक मामलों और गांव-स्तरीय योजना के लिए जमीनी स्तर पर कार्य करती है।",
      famousFor: "प्रसिद्धि", culturalHeritage: "सांस्कृतिक विरासत", postalLocation: "डाक और स्थान की जानकारी", beliefsCustoms: "विश्वास और परंपराएं",
      templeDescription: "भगवान हनुमान (शक्ति के देवता) को समर्पित पवित्र मंदिर। आसपास और दूर-दराज के गांवों के लोग नियमित रूप से पूजा और प्रार्थना करने आते हैं, विशेषकर शुभ अवसरों पर।",
      traditionalDress: "पारंपरिक पोशाक", traditionalFood: "पारंपरिक भोजन", traditionalOrnaments: "पारंपरिक आभूषण", pincode: "पिनकोड", postalAreaCode: "डाक क्षेत्र कोड",
      beliefsDescription: "समुदाय का विश्वास है कि भगवान हनुमान गांव और उसके लोगों को सभी संकटों से बचाते हैं। हनुमान मंदिर में पूजा नियमित परंपरा है, जो गांव की सांस्कृतिक और आध्यात्मिक एकता को मजबूत करती है।",
      publicInfoTitle: "मुफ्त सार्वजनिक जानकारी",
      publicInfoSubtitle: "हर नागरिक के लिए उपयोगी जानकारी, बिना कोई शुल्क लिए।",
      publicInfoBadge: "हर नागरिक के लिए मुफ्त",
      publicInfoCards: [
        { title: "सार्वजनिक नोटिस", text: "नवीनतम अपडेट, त्योहार की सूचना और गांव की घोषणा।", tag: "ताज़ा", href: "/notices" },
        { title: "फॉर्म डाउनलोड", text: "प्रमाणपत्र, शिकायत फॉर्म और सामान्य आवेदन दस्तावेज।", tag: "तुरंत एक्सेस", href: "/downloads" },
        { title: "आपातकालीन संपर्क", text: "पंचायत, पुलिस, अग्निशमन और सहायता नंबर एक ही जगह।", tag: "सहायता", href: "/emergency" },
        { title: "स्थिति और सहायता", text: "अनुरोध ट्रैक करें और तुरंत सही सलाह प्राप्त करें।", tag: "सपोर्ट", href: "/track" },
      ],
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

  const images = homeSettings.slides.map((slide) => ({
    ...slide,
    imageUrl: slide.imageUrl || "/slide.png",
    alt: slide.alt || slide.title || "Village highlight",
    href: slide.href || "/",
  }));

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_8%_12%,rgba(167,243,208,.55),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(186,230,253,.5),transparent_30%),linear-gradient(135deg,#f0fdf4,#f8fafc_48%,#ecfeff)] dark:bg-[radial-gradient(circle_at_8%_12%,rgba(6,78,59,.6),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(12,74,110,.5),transparent_30%)]" />
      <div className="relative min-h-screen text-black dark:text-white">
        {/* Notification Banner */}
        {homeSettingsLoaded && showBanner && homeSettings.popupEnabled && (
          <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-lg shadow-amber-950/5 backdrop-blur dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100 sm:items-center sm:px-5">
            <span className="flex items-center gap-2 leading-5">
              <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
              {homeSettings.popupLink ? (
                <Link href={homeSettings.popupLink} className="font-medium underline underline-offset-2">
                  {homeSettings.popupTitle || t.bannerMessage}
                </Link>
              ) : (
                <span>{homeSettings.popupTitle || t.bannerMessage}</span>
              )}
              <span className="text-amber-700 dark:text-amber-200">{homeSettings.popupMessage || t.bannerMessage}</span>
            </span>
            <button
              onClick={() => setShowBanner(false)}
              className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
            >
              <span className="sr-only">{t.close}</span><X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-5 pb-5 transition-colors duration-300 sm:space-y-7">
          <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100/80 bg-white/80 px-5 py-7 text-center shadow-[0_20px_60px_-34px_rgba(6,78,59,.45)] backdrop-blur-xl dark:border-emerald-900/60 dark:bg-slate-900/80 sm:px-10 sm:py-10 lg:px-16">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-300/35 blur-3xl dark:bg-emerald-700/25" /><div className="absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-800/25" />
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="relative mx-auto max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Digital village services</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-200 sm:text-4xl lg:text-5xl">
              {t.welcome}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              {t.description}
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/grievance" onClick={(event) => { if (authStatus !== "authenticated") { event.preventDefault(); setShowLoginWarning(true); return; } try { const saved = JSON.parse(localStorage.getItem("portal-visited-links") || "[]"); const next = [...new Set(["/grievance", ...(Array.isArray(saved) ? saved : [])])].slice(0, 20); localStorage.setItem("portal-visited-links", JSON.stringify(next)); } catch {} }} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900">Raise a request <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link><Link href="/track" onClick={(event) => { if (authStatus !== "authenticated") { event.preventDefault(); setShowLoginWarning(true); return; } try { const saved = JSON.parse(localStorage.getItem("portal-visited-links") || "[]"); const next = [...new Set(["/track", ...(Array.isArray(saved) ? saved : [])])].slice(0, 20); localStorage.setItem("portal-visited-links", JSON.stringify(next)); } catch {} }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">Track your request <ChevronRight className="h-4 w-4" /></Link></div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"><ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Simple, secure access to Panchayat services</p>
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
                {[...images, ...images].map((slide, idx) => (
                  <Link
                    key={`${slide.imageUrl}-${idx}`}
                    href={slide.href || "/"}
                    className="relative block h-32 w-52 shrink-0 overflow-hidden rounded-2xl shadow-md transition-transform duration-300 hover:scale-[1.02] sm:h-40 sm:w-64"
                  >
                    <Image
                      src={slide.imageUrl}
                      alt={slide.alt || `Chiutahara village highlight ${idx + 1}`}
                      width={448}
                      height={288}
                      className="h-full w-full object-cover object-center"
                      sizes="(max-width: 640px) 52vw, 16rem"
                    />
                  </Link>
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

          <section className="rounded-[2rem] border border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-5 py-8 shadow-[0_20px_50px_-28px_rgba(16,185,129,0.38)] dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950/30 sm:px-8 sm:py-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
                  {t.publicInfoBadge}
                </span>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {t.publicInfoTitle}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{t.publicInfoSubtitle}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {t.publicInfoCards.map((item, idx) => {
                const icons = [BellRing, FileText, Phone, BadgeCheck];
                const Icon = icons[idx] || BellRing;

                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-900/15">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition group-hover:bg-emerald-600 group-hover:text-white dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                      {language === "hi" ? "देखें" : "View"}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                  </>
                );

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group block rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/90"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white/80 to-emerald-50/90 px-5 py-8 shadow-xl shadow-sky-950/5 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950/40 sm:px-8 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-700 dark:text-sky-300">{t.village}</p><h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-300 sm:text-3xl">
              📍 {t.villageAbout}
            </h2>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t.population}</p>
                <p className="text-2xl font-bold text-blue-600">1,768</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.male}: 795 | {t.female}: 973</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t.households}</p>
                <p className="text-2xl font-bold text-green-600">269</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Code: 195584</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t.schools}</p>
                <p className="text-2xl font-bold text-purple-600">3</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.educationPriority}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t.wardMembers}</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.electedRepresentatives}</p>
              </div>
            </div>

            {/* Gram Panchayat Overview */}
            <div className="mb-4 border-y border-sky-200/80 py-5 dark:border-slate-700">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🏘️ {t.overview}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>{t.state}:</strong> Uttar Pradesh</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>{t.district}:</strong> Azamgarh</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>{t.block}:</strong> Lalganj</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>{t.gramPanchayat}:</strong> Chiutahara</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400"><strong>{t.villagesServed}:</strong> 3</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chiutahara, Lauhara, Malikan</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><strong>{t.sarpanch}:</strong> Chhotelal Yadav</p>
              <p className="text-xs text-gray-600 dark:text-gray-400"><em>{t.villageDescription}</em></p>
            </div>

            {/* Governance & Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🏛️ {t.localGovernance}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">{t.assembly}:</span> Lalganj Constituency</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">{t.parliament}:</span> Lalganj Constituency</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">{t.subDistrict}:</span> Lalganj</p>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🗳️ {t.politicalRepresentatives}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2"><span className="font-semibold">{t.mla}:</span> Shri Bechai Saroj (Samajwadi Party)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">{t.mp}:</span> Daroga Prasad Saroj (Samajwadi Party)</p>
              </div>
            </div>

            {/* Cultural Heritage & Famous For */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🙏 {t.famousFor}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Hanuman Mandir</strong> - {t.templeDescription}</p>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🎨 {t.culturalHeritage}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>{t.traditionalDress}:</strong> Dhoti Kurta<br/><strong>{t.traditionalFood}:</strong> Dal Chawal<br/><strong>{t.traditionalOrnaments}:</strong> Bichhiya</p>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">📮 {t.postalLocation}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>{t.pincode}:</strong> 276203</p>
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>{t.postalAreaCode}:</strong> 276123</p>
              </div>
            </div>

            {/* Beliefs & Customs */}
            <div className="border-t border-sky-200/80 pt-5 dark:border-slate-700">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">🙌 {t.beliefsCustoms}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t.beliefsDescription}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white/85 px-4 py-5 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 sm:px-6">
            <h2 className="text-center text-xl font-bold text-emerald-800 dark:text-emerald-300">
              {t.reviewsTitle}
            </h2>
            <p className="mb-3 text-center text-xs text-slate-600 dark:text-slate-300">
              {t.reviewsSubtitle}
            </p>

            {reviews.length > 0 ? (
              <div className="mx-auto mb-4 max-w-3xl overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${activeReviewIndex * 100}%)` }}
                >
                  {reviews.map((review) => (
                    <blockquote
                      key={review.id}
                      className="w-full shrink-0 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-left shadow-sm dark:border-slate-600 dark:bg-slate-700"
                    >
                      <p className="text-sm italic leading-6 text-slate-800 dark:text-slate-100">
                        &ldquo;{review.message}&rdquo;
                      </p>
                      {review.reasons && review.reasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {review.reasons.map((reason) => (
                            <span
                              key={reason}
                              className="inline-block rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-700 dark:text-emerald-100"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                      <footer className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <span className="mr-2 text-amber-500">{"★".repeat(review.rating || 0)}{"☆".repeat(5 - (review.rating || 0))}</span>
                        — {review.name}
                        {review.ward ? `, ${review.ward}` : ""}
                      </footer>
                    </blockquote>
                  ))}
                </div>

                {reviews.length > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {reviews.map((review, index) => (
                      <button
                        key={`${review.id}-dot`}
                        type="button"
                        aria-label={`Show review ${index + 1}`}
                        onClick={() => setActiveReviewIndex(index)}
                        className={`h-2.5 w-2.5 rounded-full transition-all ${
                          activeReviewIndex === index
                            ? "bg-emerald-600 dark:bg-emerald-400"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mb-4 text-center text-sm text-slate-500 dark:text-slate-300">
                {t.noReviews}
              </p>
            )}

            <form
              onSubmit={submitReview}
              className="mx-auto max-w-lg space-y-2 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800"
            >
              {authStatus !== "authenticated" && <p className="rounded-lg bg-amber-50 p-2.5 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">{t.reviewLogin}</p>}
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{t.reviewRating}</label>
              <div className="flex items-center justify-center gap-1 py-2">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
                      onClick={() => setReviewRating(rating)}
                      onMouseEnter={() => setHoverRating(rating)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="appearance-none border-0 bg-transparent p-0 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none"
                    >
                      <span className={`inline-block text-4xl leading-none transition-all duration-300 ${
                        (hoverRating || reviewRating) >= rating 
                          ? 'text-amber-500 drop-shadow-md' 
                          : 'text-slate-200 dark:text-slate-500'
                      }`}>
                        {(hoverRating || reviewRating) >= rating ? '★' : '☆'}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="ml-4 text-sm font-bold text-amber-700 dark:text-amber-300">
                  {hoverRating || reviewRating}/5
                </span>
              </div>
              <fieldset>
                <legend className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t.reviewReasons}</legend>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {["Fast response", "Issue solved", "Clear communication", "Issue not solved", "Slow response"].map((reason) => <label key={reason} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={reviewReasons.includes(reason)} onChange={(e) => setReviewReasons((current) => e.target.checked ? [...current, reason] : current.filter((item) => item !== reason))} />{reason}</label>)}
                </div>
              </fieldset>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-emerald-900"
                placeholder={t.reviewMessage}
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                rows={3}
              />
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-60"
              >
                {reviewSubmitting ? "..." : t.reviewSubmit}
              </button>
              {reviewFeedback && (
                <p className="text-center text-xs text-emerald-700 dark:text-emerald-300">
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

        <LoginRequiredModal isOpen={showLoginWarning} onClose={() => setShowLoginWarning(false)} callbackUrl="/" />
      </div>
    </div>
  );
}
