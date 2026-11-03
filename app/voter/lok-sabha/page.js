"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  parseVoterListResponse,
  hasVoterValue,
  getVoterName,
  getVoterId,
  getVoterGuardian,
  getVoterGender,
  getVoterAge,
  classifyVoterGender,
  getVoterConstituency,
  getVoterImage,
  getVoterSerialNumber,
  getVoterHouseNo,
  getVoterSvnNo,
  getVoterWard,
} from "@/lib/voterDisplay";
import { useLanguage } from "@/app/language-provider";

export default function LokSabhaPage() {
  const [voters, setVoters] = useState([]);
  const [search, setSearch] = useState("");
  const [constituencyFilter, setConstituencyFilter] = useState("");
  const { language } = useLanguage();

  useEffect(() => {
    fetch("/api/voter-data?type=lok-sabha")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load Lok Sabha voters");
        return res.json();
      })
      .then((data) => setVoters(parseVoterListResponse(data)))
      .catch((err) =>
        console.error("Failed to load Lok Sabha voter list:", err)
      );
  }, []);

  const uniqueConstituencies = [
    ...new Set(
      voters.map((v) => getVoterConstituency(v).toLowerCase()).filter(Boolean)
    ),
  ];

  const filteredVoters = voters.filter((voter) => {
    const name = `${getVoterName(voter, language)} ${voter.elector_name_en || ""} ${voter.elector_name_hi || ""}`.toLowerCase();
    const id = getVoterId(voter).toLowerCase();
    const constituency = getVoterConstituency(voter).toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch =
      name.includes(searchLower) || id.includes(searchLower);
    const matchesConstituency = constituencyFilter
      ? constituency === constituencyFilter.toLowerCase()
      : true;
    return matchesSearch && matchesConstituency;
  });

  const labels = {
    en: {
      title: "Lok Sabha Voter Details",
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
      title: "लोकसभा मतदाता विवरण",
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
    const category = classifyVoterGender(voter);
    if (category === "male") return language === "hi" ? "पुरुष" : "Male";
    if (category === "female") return language === "hi" ? "महिला" : "Female";
    if (language === "hi") return g;
    return g;
  };

  return (
    <div className="pt-20 px-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700 border-b pb-2">
          {t.title}
        </h1>
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
          const serialNumber = getVoterSerialNumber(voter);
          const voterId = getVoterId(voter);
          const svnNumber = getVoterSvnNo(voter);
          const constituency = getVoterConstituency(voter);
          const houseNumber = getVoterHouseNo(voter);
          const ward = getVoterWard(voter);
          const guardian = getVoterGuardian(voter, language);
          const gender = getVoterGender(voter);
          return (
            <div
              key={voter.id || `voter-${index}`}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-lg transition duration-200"
            >
              {imageSrc && (
                <Image
                  src={imageSrc}
                  alt={getVoterName(voter, language)}
                  width={400}
                  height={240}
                  unoptimized
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h2 className="text-lg font-semibold text-blue-700">
                {getVoterName(voter, language)}
              </h2>
              {hasVoterValue(serialNumber) && <p className="text-sm text-gray-600">Serial No.: {serialNumber}</p>}
              {hasVoterValue(voterId) && <p className="text-sm text-gray-600">{t.voterId}: {voterId}</p>}
              {hasVoterValue(svnNumber) && <p className="text-sm text-gray-600">SVN No.: {svnNumber}</p>}
              {hasVoterValue(constituency) && <p className="text-sm text-gray-600">{t.constituency}: {constituency}</p>}
              {hasVoterValue(houseNumber) && <p className="text-sm text-gray-600">House No.: {houseNumber}</p>}
              {hasVoterValue(ward) && <p className="text-sm text-gray-600">Ward: {ward}</p>}
              {hasVoterValue(guardian) && <p className="text-sm text-gray-600">{t.guardian}: {guardian}</p>}
              {hasVoterValue(gender) && <p className="text-sm text-gray-600">{t.gender}: {normalizeGender(voter)}</p>}
              {age !== null && <p className="text-sm text-gray-600">{t.age}: {age}</p>}
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
