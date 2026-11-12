"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const DEFAULT_SITE_SETTINGS = {
  villageName: "Chiutahara",
  villageNameHindi: "चिउटहरा",
  sloganEnabled: true,
  slogan: "Panchayat Vikas, Sarvajan Sukhaya 🌞 | Efficient Governance for Every Citizen",
  sloganHindi: "पंचायत विकास, सर्वजन सुखाय 🌞 | Efficient Governance For Every Citizen",
};

const SiteSettingsContext = createContext(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/admin/home-settings", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load village name settings.");
        const data = await response.json();
        if (active && data.settings) {
          setSettings({
            villageName: data.settings.villageName || DEFAULT_SITE_SETTINGS.villageName,
            villageNameHindi: data.settings.villageNameHindi || DEFAULT_SITE_SETTINGS.villageNameHindi,
            sloganEnabled: data.settings.sloganEnabled !== false,
            slogan: data.settings.slogan || DEFAULT_SITE_SETTINGS.slogan,
            sloganHindi: data.settings.sloganHindi || DEFAULT_SITE_SETTINGS.sloganHindi,
          });
        }
      } catch (error) {
        console.error("Failed to load village name settings:", error);
      }
    };

    const handleSettingsUpdate = (event) => {
      const updatedSettings = event.detail;
      if (!updatedSettings) return;
      setSettings({
        villageName: updatedSettings.villageName || DEFAULT_SITE_SETTINGS.villageName,
        villageNameHindi: updatedSettings.villageNameHindi || DEFAULT_SITE_SETTINGS.villageNameHindi,
        sloganEnabled: updatedSettings.sloganEnabled !== false,
        slogan: updatedSettings.slogan || DEFAULT_SITE_SETTINGS.slogan,
        sloganHindi: updatedSettings.sloganHindi || DEFAULT_SITE_SETTINGS.sloganHindi,
      });
    };

    loadSettings();
    window.addEventListener("site-settings-updated", handleSettingsUpdate);
    return () => {
      active = false;
      window.removeEventListener("site-settings-updated", handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    const siteName = `Gram Panchayat ${settings.villageName}`;
    const description = `Access citizen services, certificates, notices, development updates, and local governance information for ${siteName}.`;
    document.title = siteName;
    document.querySelector('meta[property="og:site_name"]')?.setAttribute("content", siteName);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", siteName);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="application-name"]')?.setAttribute("content", `${siteName} Portal`);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", siteName);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
    const structuredData = document.getElementById("site-organization-jsonld");
    if (structuredData?.textContent) {
      try {
        const organization = JSON.parse(structuredData.textContent);
        organization.name = siteName;
        structuredData.textContent = JSON.stringify(organization);
      } catch (error) {
        console.error("Failed to update organization metadata:", error);
      }
    }
  }, [settings.villageName]);

  const value = useMemo(() => settings, [settings]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
