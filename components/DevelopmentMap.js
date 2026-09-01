"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "@/app/theme-provider";

export default function DevelopmentMap({ projects = [], selectedId = null, className = "" }) {
  const { isDark } = useTheme();
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const initMap = useCallback(() => {
    if (!mapContainer.current || mapRef.current) return;

    const projectsWithLocation = projects.filter((p) => p.location?.latitude && p.location?.longitude);
    if (projectsWithLocation.length === 0) return;

    const avgLat = projectsWithLocation.reduce((sum, p) => sum + p.location.latitude, 0) / projectsWithLocation.length;
    const avgLng = projectsWithLocation.reduce((sum, p) => sum + p.location.longitude, 0) / projectsWithLocation.length;

    mapRef.current = window.L.map(mapContainer.current).setView([avgLat, avgLng], 12);

    const tileLayer = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    window.L.tileLayer(tileLayer, {
      attribution: isDark
        ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    const statusColors = {
      Completed: "#10b981",
      Ongoing: "#3b82f6",
      Sanctioned: "#8b5cf6",
      "On Hold": "#f59e0b",
    };

    projectsWithLocation.forEach((project) => {
      const isSelected = selectedId && project._id === selectedId;
      const color = statusColors[project.status] || "#6b7280";
      const icon = window.L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            border: ${isSelected ? "3px solid white" : "2px solid white"};
            border-radius: 50%;
            width: ${isSelected ? "40px" : "32px"};
            height: ${isSelected ? "40px" : "32px"};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-weight: bold;
            color: white;
            font-size: ${isSelected ? "18px" : "16px"};
          ">
            ${project.physicalProgress >= 80 ? "✓" : project.physicalProgress + "%"}
          </div>
        `,
        iconSize: [32, 32],
        className: "custom-marker",
      });

      const marker = window.L.marker([project.location.latitude, project.location.longitude], { icon }).addTo(mapRef.current);

      const popupContent = `
        <div style="font-size: 12px;">
          <strong>${project.title}</strong><br/>
          Scheme: ${project.scheme}<br/>
          Status: <span style="background-color: ${color}; color: white; padding: 2px 4px; border-radius: 3px;">${project.status}</span><br/>
          Progress: ${project.physicalProgress}%<br/>
          <a href="/development/${project._id}" style="color: #10b981; text-decoration: none;">View Details →</a>
        </div>
      `;

      marker.bindPopup(popupContent);
    });
  }, [isDark, projects, selectedId]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  if (projects.filter((p) => p.location?.latitude && p.location?.longitude).length === 0) {
    return (
      <div className={`${className} ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"} p-8 rounded-lg text-center`}>
        <p>No projects with GPS coordinates available for map view</p>
      </div>
    );
  }

  return <div ref={mapContainer} className={`${className} w-full h-96 rounded-lg shadow-lg border ${isDark ? "border-gray-700" : "border-gray-300"}`} />;
}
