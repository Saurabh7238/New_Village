"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

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
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const boundaryRef = useRef(null);
  const [mapError, setMapError] = useState("");

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
      <h1 className="mb-3 text-3xl font-bold text-green-700">Village Map</h1>
      <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        The orange outline is an illustrative approximation, not an official Gram Panchayat or cadastral boundary. Confirm the boundary against authoritative survey records before using it for administrative decisions.
      </p>

      {!GOOGLE_MAPS_API_KEY ? (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          The map is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment and restart the application.
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
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              {mapError}
            </p>
          ) : (
            <div
              ref={mapElementRef}
              role="region"
              aria-label="Map showing Chiutahara with an illustrative boundary"
              className="h-[450px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow dark:border-slate-700"
            />
          )}
        </>
      )}

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Google Maps JavaScript API requires an API key and a Google Cloud billing account. API usage may incur charges; apply key restrictions and review current Google Maps Platform pricing before enabling it.
      </p>
      <div className="mt-4 text-center">
        <a
          href="https://maps.app.goo.gl/dZzRUMbnFwT8aYyp7"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 underline hover:text-green-900"
        >
          Open Chiutahara in Google Maps
        </a>
      </div>
    </div>
  );
}
