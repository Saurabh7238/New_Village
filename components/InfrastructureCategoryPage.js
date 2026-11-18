"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatInfraCost, formatInfraDate } from "@/lib/infrastructureDisplay";
import { useLanguage } from "@/app/language-provider";

function InfraImage({ src, alt }) {
  if (!src) return null;

  if (src.startsWith("data:image")) {
    return (
      <Image
        src={src}
        alt={alt}
        width={400}
        height={250}
        unoptimized
        className="rounded mb-3 object-cover w-full h-40"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={250}
      className="rounded mb-3 object-cover w-full h-40"
    />
  );
}

export default function InfrastructureCategoryPage({ type, title, description }) {
  const { language } = useLanguage();
  const isHindi = language === "hi";
  const localizedTitle = isHindi
    ? {
      Road: "सड़क",
      "Street Light": "स्ट्रीट लाइट",
      "Water Pump": "जल पंप",
      "Water Tank": "जल टंकी",
      "Irrigation Project": "सिंचाई परियोजना",
      "River Monitoring": "नदी निगरानी",
      "Primary Health Center": "प्राथमिक स्वास्थ्य केंद्र",
      "Primary School": "प्राथमिक विद्यालय",
      "Anganwadi Center": "आंगनवाड़ी केंद्र",
      "Sanitation Unit": "स्वच्छता इकाई",
    }[type] || title
    : title;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/infrastructure")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load infrastructure data");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list.filter((item) => item.type === type));
      })
      .catch((err) => {
        console.error(`Failed to fetch ${type} data:`, err);
        setError(isHindi ? "बुनियादी ढांचे का डेटा लोड नहीं हो सका।" : "Failed to load infrastructure data.");
      })
      .finally(() => setIsLoading(false));
  }, [isHindi, type]);

  if (isLoading) {
    return (
      <div className="pt-36 max-w-6xl mx-auto px-4 text-center">
        <p className="text-xl text-gray-500">{isHindi ? `${localizedTitle} लोड हो रहा है...` : `Loading ${title.toLowerCase()}...`}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-36 max-w-6xl mx-auto px-4 text-center">
        <p className="text-xl text-red-500">{error}</p>
        <Link href="/infrastructure" className="text-green-600 hover:underline mt-4 inline-block">
          {isHindi ? "← बुनियादी ढांचे पर वापस जाएं" : "← Back to Infrastructure"}
        </Link>
      </div>
    );
  }

  const filteredItems = items.filter((item) => {
    const searchable = `${item.title} ${item.description} ${item.location?.address || ''} ${item.location?.village || ''}`.toLowerCase();
    return (statusFilter === "all" || item.status === statusFilter) && searchable.includes(query.toLowerCase());
  });

  const labels = language === "hi"
    ? { search: "नाम या स्थान खोजें", all: "सभी स्थितियां", noResults: "कोई रिकॉर्ड नहीं मिला।", map: "मानचित्र पर देखें", progress: "प्रगति", budget: "स्वीकृत बजट", spent: "खर्च", maintenance: "अगली देखभाल", installed: "स्थापित", completed: "पूर्ण", inaugurated: "उद्घाटन", cost: "लागत", status: "स्थिति", locationUnavailable: "स्थान उपलब्ध नहीं", allInfrastructure: "सभी बुनियादी ढांचा", operational: "चालू", underMaintenance: "रखरखाव में", broken: "खराब", planned: "नियोजित", noItems: `${localizedTitle} का कोई रिकॉर्ड नहीं मिला। व्यवस्थापक द्वारा जोड़े गए रिकॉर्ड यहां दिखाई देंगे।`, before: "पहले", after: "बाद में" }
    : { search: "Search by name or location", all: "All statuses", noResults: "No matching records found.", map: "View on map", progress: "Progress", budget: "Approved budget", spent: "Spent", maintenance: "Next maintenance", installed: "Installed", completed: "Completed", inaugurated: "Inaugurated", cost: "Cost", status: "Status", locationUnavailable: "Location N/A", allInfrastructure: "All Infrastructure", operational: "Operational", underMaintenance: "Under Maintenance", broken: "Broken", planned: "Planned", noItems: `No ${title.toLowerCase()} found. Items added from the admin panel will appear here.`, before: "Before", after: "After" };
  const grievanceCategory = type === "Road"
    ? "Road"
    : type === "Street Light"
      ? "Street Light"
      : ["Water Pump", "Water Tank", "Irrigation Project", "River Monitoring"].includes(type)
        ? "Water"
        : type === "Primary Health Center"
          ? "Health/PHC"
          : ["Primary School", "Anganwadi Center"].includes(type)
            ? "School"
            : type === "Sanitation Unit"
              ? "Drainage"
              : "Others";

  return (
    <div className="pt-36 max-w-6xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-700">{localizedTitle}</h1>
          <p className="text-gray-700 mt-2">{description}</p>
        </div>
        <Link
          href="/infrastructure"
          className="text-green-600 hover:underline text-sm font-medium"
        >
          ← {labels.allInfrastructure}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">
          {language === "hi" ? "कोई सुविधा खराब है? पंचायत को सूचित करें।" : "Is something broken? Report it to the Panchayat."}
        </p>
        <Link href={`/grievance?category=${encodeURIComponent(grievanceCategory)}&subject=${encodeURIComponent(title)}`} className="rounded bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
          {language === "hi" ? "समस्या की रिपोर्ट करें" : "Report a problem"}
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} className="rounded border p-3" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded border bg-white p-3">
          <option value="all">{labels.all}</option>
          <option value="Operational">{labels.operational}</option>
          <option value="Under Maintenance">{labels.underMaintenance}</option>
          <option value="Broken">{labels.broken}</option>
          <option value="Planned">{labels.planned}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <p className="col-span-3 text-lg text-gray-500">
          {items.length === 0 ? labels.noItems : labels.noResults}
          </p>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
            >
              <InfraImage
                src={item.image}
                alt={item.title}
              />
              <h2 className="text-lg font-semibold text-green-600">{item.title}</h2>
              <p className="text-sm text-gray-700">
                📍 {item.location?.address || labels.locationUnavailable}
              </p>
              <p className="text-sm text-gray-700">
                🗓️ {labels.installed}: {formatInfraDate(item.installationDate)}
              </p>
              {item.completionDate && <p className="text-sm text-gray-700">✅ {labels.completed}: {formatInfraDate(item.completionDate)}</p>}
              {item.inaugurationDate && <p className="text-sm text-gray-700">🎉 {labels.inaugurated}: {formatInfraDate(item.inaugurationDate)}</p>}
              <p className="text-sm text-gray-700">
                💰 {labels.cost}: {formatInfraCost(item.cost)}
              </p>
              <p className="text-sm text-gray-700">
                🛠️ {labels.status}: {isHindi && item.status === "Operational" ? labels.operational : isHindi && item.status === "Under Maintenance" ? labels.underMaintenance : isHindi && item.status === "Broken" ? labels.broken : isHindi && item.status === "Planned" ? labels.planned : item.status}
              </p>
              {item.completionPercentage > 0 && <p className="text-sm text-gray-700">📊 {labels.progress}: {item.completionPercentage}%</p>}
              {item.approvedBudget > 0 && <p className="text-sm text-gray-700">💰 {labels.budget}: {formatInfraCost(item.approvedBudget)}</p>}
              {item.amountSpent > 0 && <p className="text-sm text-gray-700">💸 {labels.spent}: {formatInfraCost(item.amountSpent)}</p>}
              {item.nextMaintenanceDate && <p className="text-sm text-gray-700">🔧 {labels.maintenance}: {formatInfraDate(item.nextMaintenanceDate)}</p>}
              {(item.location?.latitude != null && item.location?.longitude != null) && <a className="mt-2 inline-block text-sm text-blue-600 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}`}>{labels.map}</a>}
              {item.description && (
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              )}

              {(item.beforeImage || item.afterImage) && <div className="mt-3 grid grid-cols-2 gap-2">{[item.beforeImage, item.afterImage].map((photo, index) => photo && <Image key={photo} src={photo} alt={index === 0 ? labels.before : labels.after} width={180} height={110} unoptimized className="h-24 w-full rounded object-cover" />)}</div>}

              {item.details && Object.entries(item.details)
                .filter(([, value]) => value !== null && value !== undefined && value !== "")
                .map(([key, value]) => (
                  <p key={key} className="text-sm text-gray-700">
                    {key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())}: {Array.isArray(value) ? value.join(", ") : String(value)}
                  </p>
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
