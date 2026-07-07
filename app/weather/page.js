"use client";

import { useEffect, useRef, useState } from "react";

export default function WeatherPage() {
  const [unit, setUnit] = useState("c");
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widget = document.createElement("div");
    widget.id = "weatherapi-weather-widget-3";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://www.weatherapi.com/weather/widget.ashx?loc=1106237&wid=3&tu=${unit === "c" ? "2" : "1"}&div=weatherapi-weather-widget-3`;
    script.async = true;
    container.appendChild(script);

    const noscript = document.createElement("noscript");
    noscript.innerHTML = '<a href="https://www.weatherapi.com/weather/q/azamgarh-1106237" alt="Hour by hour Azamgarh weather">10 day hour by hour Azamgarh weather</a>';
    container.appendChild(noscript);

    return () => {
      container.innerHTML = "";
    };
  }, [unit]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-24 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">
              Azamgarh Weather
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Live weather forecast for Azamgarh.
            </p>
          </div>

          <div className="flex rounded-full border border-green-600 overflow-hidden">
            <button
              onClick={() => setUnit("c")}
              className={`px-4 py-2 text-sm font-semibold transition ${
                unit === "c"
                  ? "bg-green-600 text-white"
                  : "bg-white text-green-700 hover:bg-green-50 dark:bg-gray-900 dark:text-green-200"
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit("f")}
              className={`px-4 py-2 text-sm font-semibold transition ${
                unit === "f"
                  ? "bg-green-600 text-white"
                  : "bg-white text-green-700 hover:bg-green-50 dark:bg-gray-900 dark:text-green-200"
              }`}
            >
              °F
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <div ref={containerRef} className="min-h-[220px]" />
        </div>
      </div>
    </main>
  );
}
