"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const DataSaverContext = createContext({ enabled: false, toggle: () => {} });

export function DataSaverProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let savedPreference;
    try {
      savedPreference = localStorage.getItem("data-saver");
    } catch (error) {
      console.warn("Unable to read data-saver preference:", error);
    }

    const shouldEnable = savedPreference === "true"
      || (savedPreference === null && navigator.connection?.saveData === true);
    setEnabled(shouldEnable);
    document.documentElement.classList.toggle("data-saver", shouldEnable);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("data-saver", enabled);
    try {
      localStorage.setItem("data-saver", String(enabled));
    } catch (error) {
      console.warn("Unable to save data-saver preference:", error);
    }
  }, [enabled, hydrated]);

  const value = useMemo(() => ({
    enabled,
    toggle: () => setEnabled((current) => !current),
  }), [enabled]);

  return <DataSaverContext.Provider value={value}>{children}</DataSaverContext.Provider>;
}

export function useDataSaver() {
  return useContext(DataSaverContext);
}
