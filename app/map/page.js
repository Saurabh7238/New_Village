"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useLanguage } from "@/app/language-provider";
import { useSiteSettings } from "@/app/site-settings-provider";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const CHIUTAHARA_CENTER = { lat: 25.805, lng: 82.935 };

// Illustrative only; replace with surveyed or otherwise verified boundary vertices.
const CHIUTAHARA_BOUNDARY = [
  { lat: 25.8118, lng: 82.9292 },
  { lat: 25.8131, lng: 82.9354 },
  { lat: 25.8114, lng: 82.9417 },
  { lat: 25.8068, lng: 82.9440 },
  { lat: 25.8012, lng: 82.9416 },
  { lat: 25.7989, lng: 82.9362 },
  { lat: 25.8005, lng: 82.9301 },
  { lat: 25.8052, lng: 82.9276 },
];

export default function MapPage() {
  const { language } = useLanguage();
  const { villageName } = useSiteSettings();
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const boundaryRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const text = language === "hi"
    ? {
      title: "ग्राम मानचित्र",
      boundaryNotice: "नारंगी रेखा केवल एक अनुमानित उदाहरण है, यह आधिकारिक ग्राम पंचायत या भू-अभिलेख सीमा नहीं है। प्रशासनिक निर्णयों से पहले इसे आधिकारिक सर्वेक्षण अभिलेखों से सत्यापित करें।",
      missingKey: "मानचित्र कॉन्फ़िगर नहीं है। अपने वातावरण में NEXT_PUBLIC_GOOGLE_MAPS_API_KEY सेट करके एप्लिकेशन पुनः शुरू करें।",
      loadError: "Google Maps लोड नहीं हो सका। API key, सक्षम APIs और referrer प्रतिबंधों की जांच करें।",
      mapLabel: `${villageName} का मानचित्र, अनुमानित सीमा सहित`,
      billing: "Google Maps JavaScript API के लिए API key और Google Cloud billing खाते की आवश्यकता होती है। उपयोग पर शुल्क लग सकता है; API चालू करने से पहले key प्रतिबंध और वर्तमान मूल्य जांचें।",
      openMap: `${villageName} को Google Maps में खोलें`,
    }
    : {
      title: "Village Map",
      boundaryNotice: "The orange outline is an illustrative approximation, not an official Gram Panchayat or cadastral boundary. Confirm the boundary against authoritative survey records before using it for administrative decisions.",
      missingKey: "The map is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment and restart the application.",
      loadError: "Google Maps could not be loaded. Check the API key, enabled APIs, and referrer restrictions.",
      mapLabel: `Map showing ${villageName} with an illustrative boundary`,
      billing: "Google Maps JavaScript API requires an API key and a Google Cloud billing account. API usage may incur charges; apply key restrictions and review current Google Maps Platform pricing before enabling it.",
      openMap: `Open ${villageName} in Google Maps`,
    };

  const initializeMap = () => {
    if (!mapElementRef.current || mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapElementRef.current, {
      center: CHIUTAHARA_CENTER,
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const boundary = new window.google.maps.Polygon({
      paths: CHIUTAHARA_BOUNDARY,
      strokeColor: "#ff5500",
      strokeOpacity: 0.8,
      strokeWeight: 3.5,
      fillColor: "#ff5500",
      fillOpacity: 0.15,
      clickable: false,
      geodesic: true,
    });

    boundary.setMap(map);
    mapRef.current = map;
    boundaryRef.current = boundary;
  };

  useEffect(() => () => {
    boundaryRef.current?.setMap(null);
    boundaryRef.current = null;
    mapRef.current = null;
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-36">
      <h1 className="mb-3 text-3xl font-bold text-green-700">{text.title}</h1>
      <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        {text.boundaryNotice}
      </p>

      {!GOOGLE_MAPS_API_KEY ? (
        <p role="alert" lang={language} className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {text.missingKey}
        </p>
      ) : (
        <>
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly`}
            strategy="afterInteractive"
            onReady={initializeMap}
            onError={() => setMapError("Google Maps could not be loaded. Check the API key, enabled APIs, and referrer restrictions.")}
          />
          {mapError ? (
            <p role="alert" lang={language} className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              {language === "hi" ? text.loadError : mapError}
            </p>
          ) : (
            <div
              ref={mapElementRef}
              role="region"
              aria-label={text.mapLabel}
              lang={language}
              className="h-[450px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow dark:border-slate-700"
            />
          )}
        </>
      )}

      <p lang={language} className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {text.billing}
      </p>
      <div className="mt-4 text-center">
        <a
          href="https://maps.app.goo.gl/dZzRUMbnFwT8aYyp7"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 underline hover:text-green-900"
        >
          {text.openMap}
        </a>
      </div>
    </div>
  );
}
