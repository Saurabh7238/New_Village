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
        setError("Failed to load infrastructure data.");
      })
      .finally(() => setIsLoading(false));
  }, [type]);

  if (isLoading) {
    return (
      <div className="pt-36 max-w-6xl mx-auto px-4 text-center">
        <p className="text-xl text-gray-500">Loading {title.toLowerCase()}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-36 max-w-6xl mx-auto px-4 text-center">
        <p className="text-xl text-red-500">{error}</p>
        <Link href="/infrastructure" className="text-green-600 hover:underline mt-4 inline-block">
          ← Back to Infrastructure
        </Link>
      </div>
    );
  }

  const filteredItems = items.filter((item) => {
    const searchable = `${item.title} ${item.description} ${item.location?.address || ''} ${item.location?.village || ''}`.toLowerCase();
    return (statusFilter === "all" || item.status === statusFilter) && searchable.includes(query.toLowerCase());
  });

  const labels = language === "hi"
    ? { search: "नाम या स्थान खोजें", all: "सभी स्थिति", noResults: "कोई रिकॉर्ड नहीं मिला।", map: "मानचित्र पर देखें", progress: "प्रगति", budget: "स्वीकृत बजट", spent: "खर्च", maintenance: "अगली देखभाल" }
    : { search: "Search by name or location", all: "All statuses", noResults: "No matching records found.", map: "View on map", progress: "Progress", budget: "Approved budget", spent: "Spent", maintenance: "Next maintenance" };

  return (
    <div className="pt-36 max-w-6xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-700">{title}</h1>
          <p className="text-gray-700 mt-2">{description}</p>
        </div>
        <Link
          href="/infrastructure"
          className="text-green-600 hover:underline text-sm font-medium"
        >
          ← All Infrastructure
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">
          {language === "hi" ? "कोई सुविधा खराब है? पंचायत को सूचित करें।" : "Is something broken? Report it to the Panchayat."}
        </p>
        <Link href={`/grievance?category=Infrastructure&subject=${encodeURIComponent(title)}`} className="rounded bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
          {language === "hi" ? "समस्या की रिपोर्ट करें" : "Report a problem"}
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} className="rounded border p-3" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded border bg-white p-3">
          <option value="all">{labels.all}</option>
          <option value="Operational">Operational</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Broken">Broken</option>
          <option value="Planned">Planned</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <p className="col-span-3 text-lg text-gray-500">
            {items.length === 0 ? `No ${title.toLowerCase()} found. Items added from the admin panel will appear here.` : labels.noResults}
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
                📍 {item.location?.address || "Location N/A"}
              </p>
              <p className="text-sm text-gray-700">
                🗓️ Installed: {formatInfraDate(item.installationDate)}
              </p>
              <p className="text-sm text-gray-700">
                💰 Cost: {formatInfraCost(item.cost)}
              </p>
              <p className="text-sm text-gray-700">
                🛠️ Status: {item.status}
              </p>
              {item.completionPercentage > 0 && <p className="text-sm text-gray-700">📊 {labels.progress}: {item.completionPercentage}%</p>}
              {item.approvedBudget > 0 && <p className="text-sm text-gray-700">💰 {labels.budget}: {formatInfraCost(item.approvedBudget)}</p>}
              {item.amountSpent > 0 && <p className="text-sm text-gray-700">💸 {labels.spent}: {formatInfraCost(item.amountSpent)}</p>}
              {item.nextMaintenanceDate && <p className="text-sm text-gray-700">🔧 {labels.maintenance}: {formatInfraDate(item.nextMaintenanceDate)}</p>}
              {(item.location?.latitude != null && item.location?.longitude != null) && <a className="mt-2 inline-block text-sm text-blue-600 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}`}>{labels.map}</a>}
              {item.description && (
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              )}

              {(item.beforeImage || item.afterImage) && <div className="mt-3 grid grid-cols-2 gap-2">{[item.beforeImage, item.afterImage].map((photo, index) => photo && <Image key={photo} src={photo} alt={index === 0 ? 'Before' : 'After'} width={180} height={110} unoptimized className="h-24 w-full rounded object-cover" />)}</div>}

              {type === "Primary School" && item.details && (
                <>
                  {item.details.students != null && (
                    <p className="text-sm text-gray-700">
                      👨‍👩‍👧‍👦 Students: {item.details.students}
                    </p>
                  )}
                  {item.details.washrooms != null && (
                    <p className="text-sm text-gray-700">
                      🚻 Washrooms: {item.details.washrooms}
                    </p>
                  )}
                  {item.details.handpumps != null && (
                    <p className="text-sm text-gray-700">
                      🚰 Handpumps: {item.details.handpumps}
                    </p>
                  )}
                </>
              )}

              {type === "Primary Health Center" && item.details && (
                <>
                  {item.details.doctors != null && (
                    <p className="text-sm text-gray-700">
                      👨‍⚕️ Doctors: {item.details.doctors}
                    </p>
                  )}
                  {item.details.beds != null && (
                    <p className="text-sm text-gray-700">
                      🛏️ Beds: {item.details.beds}
                    </p>
                  )}
                  {item.details.ambulances != null && (
                    <p className="text-sm text-gray-700">
                      🚑 Ambulances: {item.details.ambulances}
                    </p>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
