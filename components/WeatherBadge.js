"use client";

import { useEffect, useState } from "react";

export default function WeatherBadge() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weather");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error || "Failed to load");
      setWeather(json.data);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 1000 * 60 * 10); // refresh every 10m
    return () => clearInterval(id);
  }, []);

  const temp = weather?.temp != null ? `${weather.temp}°C` : "--";
  const icon = weather?.icon ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png` : null;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800 rounded-md shadow-sm cursor-default"
        title={
          loading
            ? "Loading weather..."
            : error
            ? `Weather error: ${error}`
            : `${weather?.description ?? ""} • ${weather?.location ?? ""}`
        }
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/60 rounded-full animate-spin" />
        ) : icon ? (
          <img src={icon} alt={weather?.description || "weather"} className="w-6 h-6" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 104 4h9a3 3 0 100-6 4 4 0 00-1-7 5 5 0 00-4 9H7a4 4 0 00-4 4z" />
          </svg>
        )}

        <span className="text-sm font-semibold text-green-800 dark:text-green-200">{temp}</span>
      </div>
    </div>
  );
}
