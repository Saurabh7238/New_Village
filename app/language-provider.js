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
