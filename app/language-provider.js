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

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("language") : null;
    if (saved === "en" || saved === "hi") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
      document.documentElement.lang = language;
    }
  }, [language]);

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
