"use client";

import { useState, useEffect } from "react";
import {
  parseVoterListResponse,
  getVoterName,
  getVoterId,
  getVoterGuardian,
  getVoterGender,
  getVoterWard,
  getVoterImage,
} from "@/lib/voterDisplay";

export default function GramPanchayatPage() {
  const [voters, setVoters] = useState([]);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    fetch("/api/voter-data?type=gram-panchayat")
      .then((res) => res.json())
      .then((data) => setVoters(parseVoterListResponse(data)))
      .catch((err) =>
        console.error("Failed to load Gram Panchayat voter list:", err)
      );
  }, []);

  const uniqueWards = [
    ...new Set(voters.map((v) => getVoterWard(v).toString()).filter(Boolean)),
  ];

  const filteredVoters = voters.filter((voter) => {
    const name = getVoterName(voter).toLowerCase();
    const id = getVoterId(voter).toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch =
      name.includes(searchLower) || id.includes(searchLower);
    const ward = getVoterWard(voter).toString();
    const matchesWard = wardFilter ? ward === wardFilter : true;
    return matchesSearch && matchesWard;
  });

  const labels = {
    en: {
      title: "Gram Panchayat Voter Details",
      search: "Search by name or voter ID...",
      voterId: "Voter ID",
      ward: "Ward Number",
      guardian: "Guardian",
      gender: "Gender",
      age: "Age",
      noResults: "No voters found for selected criteria.",
      allWards: "All Wards",
      toggle: "Switch to Hindi",
    },
    hi: {
      title: "ग्राम पंचायत मतदाता विवरण",
      search: "नाम या मतदाता आईडी से खोजें...",
      voterId: "मतदाता आईडी",
      ward: "वार्ड नंबर",
      guardian: "अभिभावक",
      gender: "लिंग",
      age: "आयु",
      noResults: "चयनित मानदंडों के लिए कोई मतदाता नहीं मिला।",
      allWards: "सभी वार्ड",
      toggle: "अंग्रेज़ी में बदलें",
    },
  };

  const t = labels[language];

  const normalizeGender = (g) => {
    if (!g) return "N/A";
    if (language === "hi") return g;
    if (g === "पु" || g === "Male") return "Male";
    if (g === "म" || g === "Female") return "Female";
    return g;
  };

  return (
    <div className="pt-20 px-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-700 border-b pb-2">
          {t.title}
        </h1>
        <button
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          {t.toggle}
        </button>
      </div>

      <input
        type="text"
        placeholder={t.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      <select
        value={wardFilter}
        onChange={(e) => setWardFilter(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-6"
      >
        <option value="">{t.allWards}</option>
        {uniqueWards.map((ward, index) => (
          <option key={index} value={ward}>
            {ward}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredVoters.map((voter, index) => {
          const imageSrc = getVoterImage(voter);
          return (
            <div
              key={voter.id || `voter-${index}`}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-lg transition duration-200"
            >
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={getVoterName(voter)}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h2 className="text-lg font-semibold text-green-700">
                {getVoterName(voter)}
              </h2>
              <p className="text-sm text-gray-600">
                {t.voterId}: {getVoterId(voter) || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                {t.ward}: {getVoterWard(voter) || "Unknown"}
              </p>
              <p className="text-sm text-gray-600">
                {t.guardian}: {getVoterGuardian(voter) || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                {t.gender}: {normalizeGender(getVoterGender(voter))}
              </p>
              <p className="text-sm text-gray-600">
                {t.age}: {voter.age || "N/A"}
              </p>
            </div>
          );
        })}
        {filteredVoters.length === 0 && (
          <p className="text-gray-500">{t.noResults}</p>
        )}
      </div>
    </div>
  );
}
