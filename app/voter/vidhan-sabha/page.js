"use client";

import { useState, useEffect } from "react";
import {
  parseVoterListResponse,
  getVoterName,
  getVoterId,
  getVoterGuardian,
  getVoterGender,
  getVoterAge,
  classifyVoterGender,
  getVoterConstituency,
  getVoterImage,
} from "@/lib/voterDisplay";

export default function VidhanSabhaPage() {
  const [voters, setVoters] = useState([]);
  const [search, setSearch] = useState("");
  const [constituencyFilter, setConstituencyFilter] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    fetch("/api/voter-data?type=vidhan-sabha")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load Vidhan Sabha voters");
        return res.json();
      })
      .then((data) => setVoters(parseVoterListResponse(data)))
      .catch((err) =>
        console.error("Failed to load Vidhan Sabha voter list:", err)
      );
  }, []);

  const uniqueConstituencies = [
    ...new Set(voters.map((v) => getVoterConstituency(v)).filter(Boolean)),
  ];

  const filteredVoters = voters.filter((voter) => {
    const name = getVoterName(voter).toLowerCase();
    const id = getVoterId(voter).toLowerCase();
    const matchesSearch =
      name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
    const constituency = getVoterConstituency(voter);
    const matchesConstituency = constituencyFilter
      ? constituency === constituencyFilter
      : true;
    return matchesSearch && matchesConstituency;
  });

  const labels = {
    en: {
      title: "Vidhan Sabha Voter Details",
      search: "Search by name or voter ID...",
      voterId: "Voter ID",
      constituency: "Constituency",
      guardian: "Guardian",
      gender: "Gender",
      age: "Age",
      noResults: "No voters found for selected criteria.",
      allConstituencies: "All Constituencies",
      toggle: "Switch to Hindi",
    },
    hi: {
      title: "विधानसभा मतदाता विवरण",
      search: "नाम या मतदाता आईडी से खोजें...",
      voterId: "मतदाता आईडी",
      constituency: "निर्वाचन क्षेत्र",
      guardian: "अभिभावक",
      gender: "लिंग",
      age: "आयु",
      noResults: "चयनित मानदंडों के लिए कोई मतदाता नहीं मिला।",
      allConstituencies: "सभी निर्वाचन क्षेत्र",
      toggle: "अंग्रेज़ी में बदलें",
    },
  };

  const t = labels[language];

  const normalizeGender = (voter) => {
    const g = getVoterGender(voter);
    if (!g) return "N/A";
    if (language === "hi") return g;
    const category = classifyVoterGender(voter);
    if (category === "male") return "Male";
    if (category === "female") return "Female";
    return g;
  };

  return (
    <div className="pt-20 px-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-700 border-b pb-2">{t.title}</h1>
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
        value={constituencyFilter}
        onChange={(e) => setConstituencyFilter(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-6"
      >
        <option value="">{t.allConstituencies}</option>
        {uniqueConstituencies.map((constituency, index) => (
          <option key={index} value={constituency}>
            {constituency}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredVoters.map((voter, index) => {
          const imageSrc = getVoterImage(voter);
          const age = getVoterAge(voter);
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
              <h2 className="text-lg font-semibold text-purple-700">{getVoterName(voter)}</h2>
              <p className="text-sm text-gray-600">
                {t.voterId}: {getVoterId(voter) || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                {t.constituency}: {getVoterConstituency(voter) || "Unknown"}
              </p>
              <p className="text-sm text-gray-600">
                {t.guardian}: {getVoterGuardian(voter) || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                {t.gender}: {normalizeGender(voter)}
              </p>
              <p className="text-sm text-gray-600">
                {t.age}: {age !== null ? age : "N/A"}
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
