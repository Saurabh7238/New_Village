// /app/HomePage.jsx or /pages/index.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BellRing, BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, Droplets, FileText, HelpCircle, Hospital, MessageCircle, Route, School, Search, ShieldCheck, Sparkles, X } from "lucide-react";
// Ensure you have this file: ../components/ServiceCard.jsx
import ServiceCard from "../components/ServiceCard"; 
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { useLanguage } from "@/app/language-provider";
import { sanitizePublicReviews } from "@/lib/reviewVisibility";
import {
  countByInfraType,
  getInfraCategoryByType,
} from "@/lib/infrastructureDisplay";

const INFRA_TYPE_ICONS = {
  Road: Route,
  "Primary School": School,
  "Primary Health Center": Hospital,
  "Water Pump": Droplets,
};

const FEATURED_INFRA_TYPES = [
  "Road",
  "Primary School",
  "Primary Health Center",
  "Water Pump",
];

const FEATURED_SERVICE_HREFS = [
  "/grievance",
  "/birth",
  "/death",
  "/appointments",
];

const FEATURED_SERVICE_ICONS = {
  "/grievance": HelpCircle,
  "/birth": FileText,
  "/death": FileText,
  "/appointments": CalendarDays,
};

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
  const [latestNotices, setLatestNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticesError, setNoticesError] = useState(false);
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
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategory, setServiceCategory] = useState("All services");
  const [showAllServices, setShowAllServices] = useState(false);
  const [infrastructureCounts, setInfrastructureCounts] = useState(null);
  const [infrastructureLoadFailed, setInfrastructureLoadFailed] = useState(false);
  const highlightsRef = useRef(null);
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

  useEffect(() => {
    const loadLatestNotices = async () => {
      try {
        const response = await fetch("/api/notifications?page=1&limit=3");
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.notifications)) {
          throw new Error("Could not load latest notices.");
        }
        setLatestNotices(data.notifications);
      } catch (error) {
        console.error("Failed to load latest homepage notices:", error);
        setNoticesError(true);
      } finally {
        setNoticesLoading(false);
      }
    };

    loadLatestNotices();
  }, []);

  useEffect(() => {
    const loadInfrastructure = async () => {
      try {
        const response = await fetch("/api/infrastructure");
        if (!response.ok) throw new Error("Failed to load village infrastructure.");
        const data = await response.json();
        setInfrastructureCounts(countByInfraType(Array.isArray(data) ? data : []));
      } catch (error) {
        console.error("Failed to load homepage infrastructure:", error);
        setInfrastructureLoadFailed(true);
      }
    };

    loadInfrastructure();
  }, []);

  // Reviews: load on mount and refresh every 15s for real-time updates
  useEffect(() => {
    loadReviews();
    const reviewInterval = setInterval(loadReviews, 15000);
    return () => clearInterval(reviewInterval);
  }, []);

  useEffect(() => {
    if (reviews.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const carouselInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveReviewIndex((current) => (current + 1) % reviews.length);
      }
    }, 5000);

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
    },
  };

  const t = labels[language];

  const services = [
    { title: "Raise Query", hindi: "शिकायत दर्ज करें", href: "/grievance", category: "Requests" },
    { title: "Track Query", hindi: "शिकायत ट्रैक करें", href: "/track", category: "Requests" },
    { title: "Birth Certificates", hindi: "जन्म प्रमाण पत्र", href: "/birth", category: "Certificates" },
    { title: "Death Certificates", hindi: "मृत्यु प्रमाण पत्र", href: "/death", category: "Certificates" },
    { title: "Aadhaar Create / Update", hindi: "आधार बनवाएं / अपडेट करें", href: "/aadhar", category: "Certificates" },
    { title: "Voter List", hindi: "मतदाता सूची", href: "/voter", category: "Village information" },
    { title: "Gram Budget", hindi: "ग्राम बजट", href: "/budget", category: "Village information" },
    { title: "Panchayat Funds", hindi: "पंचायत निधि", href: "/funds", category: "Village information" },
    { title: "Development Projects", hindi: "विकास परियोजनाएं", href: "/development", category: "Village information" },
    { title: "Panchayat Members", hindi: "पंचायत सदस्य", href: "/members", category: "Village information" },
    { title: "Appointments", hindi: "नियुक्तियां", href: "/appointments", category: "Requests" },
    { title: "Gallery", hindi: "गैलरी", href: "/gallery", category: "Village information" },
    { title: "Map", hindi: "मानचित्र", href: "/map", category: "Village information" },
    { title: "Rivers, Roads & Lights", hindi: "नदियां, सड़कें और लाइटें", href: "/infrastructure", category: "Village information" },
  ];
  const serviceCategories = ["All services", "Requests", "Certificates", "Village information"];
  const visibleServices = services.filter((service) =>
    (serviceCategory === "All services" || service.category === serviceCategory) &&
    `${service.title} ${service.hindi}`.toLowerCase().includes(serviceSearch.trim().toLowerCase())
  );

  const images = homeSettings.slides.map((slide) => ({
    ...slide,
    imageUrl: slide.imageUrl || "/slide.png",
    alt: slide.alt || slide.title || "Village highlight",
    href: slide.href || "/",
  }));

  const scrollHighlights = (direction) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    highlightsRef.current?.scrollBy({
      left: direction * Math.max(260, highlightsRef.current.clientWidth * 0.75),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const quickLinks = [
    { title: "Track a request", hindi: "अपनी शिकायत ट्रैक करें", href: "/track", icon: HelpCircle },
    { title: "Voter list", hindi: "मतदाता सूची", href: "/voter", icon: BadgeCheck },
    { title: "Development projects", hindi: "विकास कार्य", href: "/development", icon: ArrowRight },
    { title: "Budget & funds", hindi: "बजट और निधि", href: "/budget", icon: FileText },
    { title: "All notices", hindi: "सभी सूचनाएं देखें", href: "/notifications", icon: BellRing },
  ];

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 border-b border-slate-200/70 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40" />
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
          <section className="overflow-hidden rounded-3xl border border-teal-950/10 bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-800 text-white shadow-xl shadow-teal-950/10">
            <div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="flex flex-col items-start px-5 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-14">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-teal-50">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Digital village services
                </span>
                <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  {t.welcome}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-teal-50/90 sm:text-lg">
                  {t.description}
                </p>
                <div className="mt-7 flex w-full flex-col gap-3 min-[420px]:w-auto min-[420px]:flex-row">
                  <Link href="/grievance" onClick={(event) => { if (authStatus !== "authenticated") { event.preventDefault(); setShowLoginWarning(true); return; } try { const saved = JSON.parse(localStorage.getItem("portal-visited-links") || "[]"); const next = [...new Set(["/grievance", ...(Array.isArray(saved) ? saved : [])])].slice(0, 20); localStorage.setItem("portal-visited-links", JSON.stringify(next)); } catch {} }} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50 focus-visible:outline-white">
                    Raise a request <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link href="/track" onClick={(event) => { if (authStatus !== "authenticated") { event.preventDefault(); setShowLoginWarning(true); return; } try { const saved = JSON.parse(localStorage.getItem("portal-visited-links") || "[]"); const next = [...new Set(["/track", ...(Array.isArray(saved) ? saved : [])])].slice(0, 20); localStorage.setItem("portal-visited-links", JSON.stringify(next)); } catch {} }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-white">
                    Track your request <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs font-medium text-teal-50/90"><ShieldCheck className="h-4 w-4 text-emerald-200" />Simple, secure access to Panchayat services</p>
              </motion.div>
            </div>
          </section>

          <section aria-labelledby="popular-services-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">Quick access</p>
                <h2 id="popular-services-heading" className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Popular services</h2>
              </div>
              <Link href="#services" onClick={() => setShowAllServices(true)} className="text-sm font-semibold text-teal-800 hover:underline dark:text-teal-300">View all services ↓</Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {quickLinks.map(({ title, hindi, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-h-20 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-slate-900"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-300">{title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{hindi}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="highlights-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">Discover Chiutahara</p>
                <h2 id="highlights-heading" className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Village highlights</h2>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => scrollHighlights(-1)} aria-label="Scroll village highlights left" className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => scrollHighlights(1)} aria-label="Scroll village highlights right" className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            <div ref={highlightsRef} role="region" aria-label="Village highlight photos; scroll horizontally to browse" tabIndex={0} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
              {images.map((slide, idx) => (
                <Link
                  key={`${slide.imageUrl}-${idx}`}
                  href={slide.href || "/"}
                  className="group relative h-40 w-[78vw] max-w-80 shrink-0 snap-start overflow-hidden rounded-xl bg-slate-200 shadow-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal-500 sm:h-48 sm:w-72"
                >
                  <Image
                    src={slide.imageUrl}
                    alt={slide.alt || `Chiutahara village highlight ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 78vw, 18rem"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent px-4 pb-3 pt-10 text-sm font-bold text-white">
                    {slide.title || slide.alt || `Village highlight ${idx + 1}`}
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Swipe or use the arrows to browse.</p>
          </section>

          <section aria-label="Panchayat motto" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 sm:px-6">
            {t.slogan}
          </section>

          <section aria-labelledby="latest-notices-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">Stay informed</p>
                <h2 id="latest-notices-heading" className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">Latest notices</h2>
              </div>
              <Link href="/notifications" className="inline-flex items-center gap-1 text-sm font-bold text-teal-800 hover:underline dark:text-teal-300">
                View all notices <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            {noticesLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400" role="status">Loading notices…</p>
            ) : noticesError ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Notices are temporarily unavailable. <Link href="/notifications" className="font-semibold text-teal-800 underline dark:text-teal-300">Open the notice board</Link>.
              </p>
            ) : latestNotices.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">There are no current notices. Check the notice board for updates.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-3">
                {latestNotices.map((notice) => (
                  <li key={notice.id} className="min-w-0">
                    <Link href={`/notifications/${notice.id}`} className="group block h-full rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-slate-700 dark:hover:border-teal-700 dark:hover:bg-slate-800">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
                          <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
                          {String(notice.category || notice.type || "Notice").replaceAll("_", " ")}
                        </span>
                        {notice.priority && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            notice.priority === "urgent" || notice.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                              : notice.priority === "medium"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>{notice.priority}</span>
                        )}
                      </span>
                      <span className="mt-2 block font-bold text-slate-900 dark:text-white">{notice.title}</span>
                      <span className="mt-1 line-clamp-2 block text-sm text-slate-600 dark:text-slate-300">{notice.description}</span>
                      <time dateTime={notice.issueDate || notice.createdAt} className="mt-3 block text-xs font-medium text-slate-500 dark:text-slate-400">
                        {new Date(notice.issueDate || notice.createdAt).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN")}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="services" className="py-2 sm:py-4">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">Citizen portal</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {t.services}
                </h2>
              </div>
              <button
                type="button"
                aria-expanded={showAllServices}
                aria-controls="all-services-directory"
                onClick={() => setShowAllServices((visible) => !visible)}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-teal-300 dark:hover:bg-teal-950/40"
              >
                {showAllServices ? "Show featured services" : "View all services"}
                <ChevronRight className={`h-4 w-4 transition-transform ${showAllServices ? "rotate-90" : ""}`} aria-hidden="true" />
              </button>
            </div>
            <ul className="grid gap-x-10 divide-y divide-slate-100 dark:divide-slate-800 md:grid-cols-2 md:divide-y-0">
              {services.filter((service) => FEATURED_SERVICE_HREFS.includes(service.href)).map((service) => {
                const ServiceIcon = FEATURED_SERVICE_ICONS[service.href] || FileText;
                return (
                  <li key={service.href} className="border-b border-slate-100 dark:border-slate-800 md:last:border-b-0">
                    <Link href={service.href} className="group flex min-h-14 items-center gap-3 py-3 text-slate-800 transition hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-slate-100 dark:hover:text-teal-300">
                      <ServiceIcon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-700 dark:text-slate-500 dark:group-hover:text-teal-300" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{service.title}</span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{service.hindi}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700 dark:group-hover:text-teal-300" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div id="all-services-directory" hidden={!showAllServices} className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="mb-4 flex flex-col gap-3 md:flex-row">
                  <label className="relative block flex-1">
                    <span className="sr-only">Search services</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input type="search" value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} placeholder="Search services / सेवाएं खोजें" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                  </label>
                  <div role="group" aria-label="Filter services by category" className="flex gap-2 overflow-x-auto pb-1">
                    {serviceCategories.map((category) => (
                      <button key={category} type="button" aria-pressed={serviceCategory === category} onClick={() => setServiceCategory(category)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold ${
                        serviceCategory === category
                          ? "border-teal-800 bg-teal-800 text-white dark:border-teal-300 dark:bg-teal-300 dark:text-teal-950"
                          : "border-slate-300 bg-white text-slate-700 hover:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        }`}>{language === "hi"
                          ? ({ "All services": "सभी सेवाएं", Requests: "अनुरोध", Certificates: "प्रमाणपत्र", "Village information": "गांव की जानकारी" }[category])
                          : category}</button>
                    ))}
                  </div>
                </div>
                {visibleServices.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleServices.map((service, index) => (
                      <ServiceCard
                        key={service.href}
                        title={service.title}
                        hindi={service.hindi}
                        href={service.href}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">No services match your search. Try a different word or category.</p>
                )}
            </div>
          </section>

          <section aria-labelledby="infrastructure-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">Village information</p>
                <h2 id="infrastructure-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Village infrastructure</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Explore public facilities and development across the village.</p>
              </div>
              <Link href="/infrastructure" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-teal-300 dark:hover:bg-teal-950/40">
                View all infrastructure <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-x-10 divide-y divide-slate-100 dark:divide-slate-800 md:grid-cols-2 md:divide-y-0">
              {FEATURED_INFRA_TYPES.map((type) => {
                const category = getInfraCategoryByType(type);
                if (!category) return null;
                const TypeIcon = INFRA_TYPE_ICONS[type] || Route;
                const count = infrastructureCounts?.[type];

                return (
                  <li key={type} className="border-b border-slate-100 dark:border-slate-800 md:last:border-b-0">
                    <Link href={`/infrastructure/${category.slug}`} className="group flex min-h-14 items-center gap-3 py-3 text-slate-800 transition hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-slate-100 dark:hover:text-teal-300">
                      <TypeIcon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-700 dark:text-slate-500 dark:group-hover:text-teal-300" aria-hidden="true" />
                      <span className="min-w-0 flex-1 text-sm font-medium">{category.hubLabel}</span>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {infrastructureLoadFailed
                          ? "Count unavailable"
                          : count === undefined
                            ? "Loading…"
                            : `${count} ${count === 1 ? "item" : "items"}`}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700 dark:group-hover:text-teal-300" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white px-5 py-7 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:px-8 sm:py-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">{t.village}</p><h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              📍 {t.villageAbout}
            </h2>

            {/* Key Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: t.population, value: "1,768", note: `${t.male}: 795 · ${t.female}: 973`, color: "text-blue-700 dark:text-blue-300" },
                { label: t.households, value: "269", note: "Code: 195584", color: "text-emerald-700 dark:text-emerald-300" },
                { label: t.schools, value: "3", note: t.educationPriority, color: "text-violet-700 dark:text-violet-300" },
                { label: t.wardMembers, value: "12", note: t.electedRepresentatives, color: "text-amber-700 dark:text-amber-300" },
              ].map((stat) => (
                <article key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{stat.label}</p>
                  <p className={`mt-1 text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.note}</p>
                </article>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">🏘️ {t.overview}</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><dt className="text-slate-500 dark:text-slate-400">{t.state}</dt><dd className="font-semibold">Uttar Pradesh</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">{t.district}</dt><dd className="font-semibold">Azamgarh</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">{t.block}</dt><dd className="font-semibold">Lalganj</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">{t.gramPanchayat}</dt><dd className="font-semibold">Chiutahara</dd></div>
                </dl>
                <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{t.villageDescription}</p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300"><strong>{t.villagesServed}:</strong> Chiutahara, Lauhara, Malikan</p>
              </section>

              <details className="group rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-white">
                  <span className="flex items-center justify-between gap-3">🏛️ {t.localGovernance} & {t.politicalRepresentatives}<ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" /></span>
                </summary>
                <div className="mt-4 space-y-3 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
                  <p><span className="font-semibold">{t.assembly}:</span> Lalganj Constituency</p>
                  <p><span className="font-semibold">{t.parliament}:</span> Lalganj Constituency</p>
                  <p><span className="font-semibold">{t.subDistrict}:</span> Lalganj</p>
                  <p><span className="font-semibold">{t.mla}:</span> Shri Bechai Saroj (Samajwadi Party)</p>
                  <p><span className="font-semibold">{t.mp}:</span> Daroga Prasad Saroj (Samajwadi Party)</p>
                </div>
              </details>

              <details className="group rounded-xl border border-slate-200 p-4 dark:border-slate-700 lg:col-span-2">
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-white">
                  <span className="flex items-center justify-between gap-3">🙏 {t.culturalHeritage}, {t.famousFor} & {t.postalLocation}<ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" /></span>
                </summary>
                <div className="mt-4 grid gap-4 border-t border-slate-200 pt-3 text-xs leading-5 dark:border-slate-700 md:grid-cols-3">
                  <div><p className="mb-1 font-semibold">{t.famousFor}</p><p><strong>Hanuman Mandir</strong> — {t.templeDescription}</p><p className="mt-2">{t.beliefsDescription}</p></div>
                  <div><p className="mb-1 font-semibold">{t.culturalHeritage}</p><p><strong>{t.traditionalDress}:</strong> Dhoti Kurta</p><p><strong>{t.traditionalFood}:</strong> Dal Chawal</p><p><strong>{t.traditionalOrnaments}:</strong> Bichhiya</p></div>
                  <div><p className="mb-1 font-semibold">{t.postalLocation}</p><p><strong>{t.pincode}:</strong> 276203</p><p><strong>{t.postalAreaCode}:</strong> 276123</p></div>
                </div>
              </details>
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
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <button type="button" aria-label="Previous review" onClick={() => setActiveReviewIndex((current) => (current - 1 + reviews.length) % reviews.length)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center justify-center gap-2">
                      {reviews.map((review, index) => (
                        <button
                          key={`${review.id}-dot`}
                          type="button"
                          aria-label={`Show review ${index + 1}`}
                          aria-current={activeReviewIndex === index ? "true" : undefined}
                          onClick={() => setActiveReviewIndex(index)}
                          className={`h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                            activeReviewIndex === index
                              ? "bg-emerald-600 dark:bg-emerald-400"
                              : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <button type="button" aria-label="Next review" onClick={() => setActiveReviewIndex((current) => (current + 1) % reviews.length)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700">
                      <ChevronRight className="h-4 w-4" />
                    </button>
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

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">Location</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Chiutahara Panchayat Map</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Find the Panchayat location and nearby landmark.</p>
            </div>
            <Link
              href="/map"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-teal-200 px-4 py-2 text-sm font-bold text-teal-800 transition hover:bg-teal-50 dark:border-teal-700 dark:text-teal-200 dark:hover:bg-teal-950"
            >
              Open full map <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <iframe
            title="Chiutahara Panchayat map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3584.370430999999!2d83.0625204!3d25.7310942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3991cf1450dc16cf%3A0xd24a5f561129b0b!2sShri%20Radhe%20Krishna%20Mandir!5e0!3m2!1sen!2sin!4v1694767000000!5m2!1sen!2sin"
            className="h-72 w-full border-0 sm:h-96"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><MessageCircle className="h-4 w-4 text-teal-700 dark:text-teal-300" aria-hidden="true" />{t.contactTitle}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.contactMessage}</p>
            </div>
            <a href={t.whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />{t.whatsapp}
            </a>
            <Link href="/grievance" onClick={(event) => { if (authStatus !== "authenticated") { event.preventDefault(); setShowLoginWarning(true); } }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:border-teal-500 hover:text-teal-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-teal-300">
              Raise a request <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

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
