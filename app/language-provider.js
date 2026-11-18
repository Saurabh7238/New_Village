"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext({
  language: "en",
  toggleLanguage: () => {},
  setLanguage: () => {},
});

const LABELS = {
  en: {
    langToggle: "हिंदी",
    language: "Language",
    highContrast: "High contrast",
    enableHighContrast: "Enable high contrast",
    disableHighContrast: "Disable high contrast",
    menu: "Menu",
    close: "Close",
    weather: "Weather",
    register: "Register",
    signIn: "Sign In",
    signOut: "Sign Out",
    adminPanel: "Admin Panel",
    home: "Home",
    birth: "Birth",
    death: "Death",
    aadhar: "Aadhar",
    voter: "Voter",
    budget: "Budget",
    funds: "Funds",
    development: "Development",
    members: "Members",
    appointments: "Appointments",
    gallery: "Gallery",
    map: "Map",
    infra: "Infra",
    services: "Services",
    emergency: "Emergency",
    emergencyContacts: "Emergency contacts",
    communityUpdates: "Community updates",
    notifications: "Notifications",
    noNotifications: "No notifications",
    dashboard: "Dashboard",
    myProfile: "My Profile",
    loggedInAs: "Logged in as",
    logout: "Logout",
    logIn: "Log In",
    signUp: "Sign Up",
    toggleDarkMode: "Toggle dark mode",
    largerText: "Use larger text size",
    normalText: "Use normal text size",
    loginRequired: "Login required",
    loginRequiredMessage: "Please log in first to submit a request, service application, query, or suggestion.",
    cancel: "Cancel",
    loginNow: "Login now",
    loadingMessage: "Please wait while we fetch your information...",
    portal: "Portal",
    gramPanchayat: "Gram Panchayat",
    loading: "Loading...",
    login: "Login",
    forgotPassword: "Forgot Password",
    resetPassword: "Reset Password",
    registerAccount: "Create your account",
    mobileOrEmail: "Mobile number or email",
    password: "Password",
    confirmPassword: "Confirm Password",
    dateOfBirth: "Date of Birth",
    aadhaarNumber: "Aadhaar Number",
    newPassword: "New Password",
    backToSignIn: "Back to Sign in",
    documents: "My Documents",
    view: "View",
    download: "Download",
    delete: "Delete",
    appointmentsTitle: "Appointments",
    bookAppointment: "Book Appointment",
    purpose: "Purpose",
    saveDraft: "Save draft",
    submitApplication: "Submit application",
    banner: "📢 New voter list available! Check the updates in the Voter section.",
  },
  hi: {
    langToggle: "English",
    language: "भाषा",
    highContrast: "उच्च कंट्रास्ट",
    enableHighContrast: "उच्च कंट्रास्ट चालू करें",
    disableHighContrast: "उच्च कंट्रास्ट बंद करें",
    menu: "मेनू",
    close: "बंद करें",
    weather: "मौसम",
    register: "रजिस्टर",
    signIn: "साइन इन",
    signOut: "साइन आउट",
    adminPanel: "एडमिन पैनल",
    home: "होम",
    birth: "जन्म",
    death: "मृत्यु",
    aadhar: "आधार",
    voter: "मतदाता",
    budget: "बजट",
    funds: "कोष",
    development: "विकास",
    members: "सदस्य",
    appointments: "नियुक्तियाँ",
    gallery: "गैलरी",
    map: "मानचित्र",
    infra: "इंफ्रा",
    services: "सेवाएं",
    emergency: "आपातकाल",
    emergencyContacts: "आपातकालीन संपर्क",
    communityUpdates: "गांव की सूचनाएं",
    notifications: "सूचनाएं",
    noNotifications: "कोई सूचना नहीं",
    dashboard: "डैशबोर्ड",
    myProfile: "मेरी प्रोफ़ाइल",
    loggedInAs: "लॉग इन हैं",
    logout: "लॉग आउट",
    logIn: "लॉग इन",
    signUp: "साइन अप",
    toggleDarkMode: "डार्क मोड बदलें",
    largerText: "बड़ा टेक्स्ट उपयोग करें",
    normalText: "सामान्य टेक्स्ट उपयोग करें",
    loginRequired: "लॉगिन आवश्यक है",
    loginRequiredMessage: "अनुरोध, सेवा आवेदन, प्रश्न या सुझाव भेजने के लिए पहले लॉगिन करें।",
    cancel: "रद्द करें",
    loginNow: "अभी लॉगिन करें",
    loadingMessage: "कृपया प्रतीक्षा करें, आपकी जानकारी लोड हो रही है...",
    portal: "पोर्टल",
    gramPanchayat: "ग्राम पंचायत",
    loading: "लोड हो रहा है...",
    login: "लॉगिन",
    forgotPassword: "पासवर्ड भूल गए",
    resetPassword: "पासवर्ड रीसेट करें",
    registerAccount: "अपना खाता बनाएं",
    mobileOrEmail: "मोबाइल नंबर या ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    dateOfBirth: "जन्म तिथि",
    aadhaarNumber: "आधार नंबर",
    newPassword: "नया पासवर्ड",
    backToSignIn: "साइन इन पर वापस जाएं",
    documents: "मेरे दस्तावेज़",
    view: "देखें",
    download: "डाउनलोड",
    delete: "हटाएं",
    appointmentsTitle: "अपॉइंटमेंट",
    bookAppointment: "अपॉइंटमेंट बुक करें",
    purpose: "उद्देश्य",
    saveDraft: "ड्राफ्ट सेव करें",
    submitApplication: "आवेदन सबमिट करें",
    banner: "📢 नई मतदाता सूची उपलब्ध है! वोटर सेक्शन में अपडेट देखें।",
  },
};

export function LanguageProvider({ children, initialLanguage = "en" }) {
  const [language, setLanguage] = useState(initialLanguage === "hi" ? "hi" : "en");
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    const hasLanguageCookie = document.cookie.split("; ").some((cookie) => cookie.startsWith("language="));
    if (!hasLanguageCookie) {
      try {
        const saved = localStorage.getItem("language");
        if (saved === "en" || saved === "hi") setLanguage(saved);
      } catch (error) {
        console.warn("Unable to read saved language preference:", error);
      }
    }
    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    if (!languageLoaded) return;
    try {
      localStorage.setItem("language", language);
    } catch (error) {
      console.warn("Unable to save language preference in local storage:", error);
    }
    document.cookie = `language=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = language;
  }, [language, languageLoaded]);

  const toggleLanguage = () => {
    setLanguage((current) => (current === "en" ? "hi" : "en"));
  };

  const value = useMemo(
    () => ({
      language,
      toggleLanguage,
      setLanguage,
      labels: LABELS[language],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
