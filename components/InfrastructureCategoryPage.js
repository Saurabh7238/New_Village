"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatInfraCost, formatInfraDate } from "@/lib/infrastructureDisplay";

function InfraImage({ src, alt }) {
  if (!src) return null;

  if (src.startsWith("data:image")) {
    return (
      <img
        src={src}
        alt={alt}
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
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <p className="col-span-3 text-lg text-gray-500">
            No {title.toLowerCase()} found. Items added from the admin panel will appear here.
          </p>
        ) : (
          items.map((item) => (
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
              {item.description && (
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              )}

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
