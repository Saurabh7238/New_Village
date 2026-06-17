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
  getVoterWard,
  getVoterImage,
  getVoterSerialNumber,
  getVoterPoolingBooth,
  getVoterRelationship,
  getVoterDOB,
} from "@/lib/voterDisplay";

export default function GramPanchayatPage() {
  const [voters, setVoters] = useState([]);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [poolingBoothFilter, setPoolingBoothFilter] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    fetch("/api/voter-data?type=gram-panchayat")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load Gram Panchayat voters");
        return res.json();
      })
      .then((data) => setVoters(parseVoterListResponse(data)))
      .catch((err) =>
        console.error("Failed to load Gram Panchayat voter list:", err)
      );
  }, []);

  const uniqueWards = [
    ...new Set(voters.map((v) => getVoterWard(v).toString()).filter(Boolean)),
  ].sort((a, b) => parseInt(a) - parseInt(b));

  const uniquePoolingBooths = [
    ...new Set(
      voters.map((v) => getVoterPoolingBooth(v).toString()).filter(Boolean)
    ),
  ].sort();

  const filteredVoters = voters.filter((voter) => {
    const name = getVoterName(voter).toLowerCase();
    const id = getVoterId(voter).toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch =
      name.includes(searchLower) || id.includes(searchLower);

    const ward = getVoterWard(voter).toString();
    const matchesWard = wardFilter ? ward === wardFilter : true;

    const booth = getVoterPoolingBooth(voter).toString();
    const matchesPoolingBooth = poolingBoothFilter
      ? booth === poolingBoothFilter
      : true;

    const gender = classifyVoterGender(voter);
    const matchesGender = genderFilter === "all" || gender === genderFilter;

    const age = getVoterAge(voter);
    const min = minAge ? parseInt(minAge) : 0;
    const max = maxAge ? parseInt(maxAge) : 150;
    const matchesAge = age === null || (age >= min && age <= max);

    return (
      matchesSearch &&
      matchesWard &&
      matchesPoolingBooth &&
      matchesGender &&
      matchesAge
    );
  });

  const formatDOB = (voterDOB) => {
    if (!voterDOB) return "N/A";
    const dobDate = new Date(voterDOB);
    if (isNaN(dobDate.getTime())) return "N/A";

    if (language === "hi") {
      return dobDate.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return dobDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
      serialNo: "Serial Number",
      epicNo: "EPIC Number",
      poolingBooth: "Pooling Booth",
      relationship: "Relationship",
      dob: "Date of Birth",
      houseNo: "House Number",
      filterByGender: "Filter by Gender",
      filterByAge: "Filter by Age Range",
      minAge: "Min Age",
      maxAge: "Max Age",
      male: "Male",
      female: "Female",
      all: "All",
      allBooths: "All Pooling Booths",
      clearFilters: "Clear Filters",
      filters: "Filters",
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
      serialNo: "क्रमांक संख्या",
      epicNo: "EPIC संख्या",
      poolingBooth: "मतदान बूथ",
      relationship: "रिश्ता",
      dob: "जन्मतिथि",
      houseNo: "मकान संख्या",
      filterByGender: "लिंग से फ़िल्टर करें",
      filterByAge: "आयु श्रेणी से फ़िल्टर करें",
      minAge: "न्यूनतम आयु",
      maxAge: "अधिकतम आयु",
      male: "पुरुष",
      female: "महिला",
      all: "सभी",
      allBooths: "सभी मतदान बूथ",
      clearFilters: "फ़िल्टर साफ़ करें",
      filters: "फ़िल्टर",
    },
  };

  const t = labels[language];

  const normalizeGender = (voter) => {
    const g = getVoterGender(voter);
    if (!g) return "N/A";
    if (language === "hi") return g;
    const category = classifyVoterGender(voter);
    if (category === "male") return t.male;
    if (category === "female") return t.female;
    return g;
  };

  const handleClearFilters = () => {
    setSearch("");
    setWardFilter("");
    setGenderFilter("all");
    setPoolingBoothFilter("");
    setMinAge("");
    setMaxAge("");
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700 border-b pb-2">
          {t.title}
        </h1>
        <button
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition font-semibold"
        >
          {t.toggle}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">{t.filters}</h2>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.ward}
              </label>
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t.allWards}</option>
                {uniqueWards.map((ward, index) => (
                  <option key={index} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.poolingBooth}
              </label>
              <select
                value={poolingBoothFilter}
                onChange={(e) => setPoolingBoothFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t.allBooths}</option>
                {uniquePoolingBooths.map((booth, index) => (
                  <option key={index} value={booth}>
                    {booth}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.filterByGender}
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">{t.all}</option>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.minAge}
              </label>
              <input
                type="number"
                min="0"
                max="150"
                placeholder={t.minAge}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.maxAge}
              </label>
              <input
                type="number"
                min="0"
                max="150"
                placeholder={t.maxAge}
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
              >
                {t.clearFilters}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {filteredVoters.length} {filteredVoters.length === 1 ? "voter" : "voters"}{" "}
          found
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVoters.length > 0 ? (
          filteredVoters.map((voter, index) => {
            const imageSrc = getVoterImage(voter);
            const age = getVoterAge(voter);
            const dob = getVoterDOB(voter);
            const serialNo = getVoterSerialNumber(voter);
            const epicNo = getVoterId(voter);
            const booth = getVoterPoolingBooth(voter);
            const relationship = getVoterRelationship(voter);
            const ward = getVoterWard(voter);

            return (
              <div
                key={voter.id || `voter-${index}`}
                className="bg-white border-2 border-green-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-200"
              >
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt={getVoterName(voter)}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  {serialNo && (
                    <p className="text-xs font-semibold text-blue-600 mb-2">
                      {t.serialNo}: {serialNo}
                    </p>
                  )}

                  <h2 className="text-lg font-bold text-green-700 mb-3">
                    {getVoterName(voter)}
                  </h2>

                  <div className="space-y-2 text-sm">
                    {epicNo && (
                      <p className="text-gray-700">
                        <span className="font-semibold text-blue-600">
                          {t.epicNo}:
                        </span>{" "}
                        {epicNo}
                      </p>
                    )}

                    {relationship && (
                      <p className="text-gray-700">
                        <span className="font-semibold">{t.relationship}:</span>{" "}
                        {relationship}
                      </p>
                    )}

                    <p className="text-gray-700">
                      <span className="font-semibold">{t.houseNo}:</span>{" "}
                      {ward || "N/A"}
                    </p>

                    {booth && (
                      <p className="text-gray-700">
                        <span className="font-semibold">{t.poolingBooth}:</span>{" "}
                        {booth}
                      </p>
                    )}

                    <p className="text-gray-700">
                      <span className="font-semibold">{t.gender}:</span>{" "}
                      {normalizeGender(voter)}
                    </p>

                    <p className="text-gray-700">
                      <span className="font-semibold">{t.age}:</span>{" "}
                      {age !== null ? age : "N/A"}
                    </p>

                    {dob && (
                      <p className="text-gray-700">
                        <span className="font-semibold">{t.dob}:</span>{" "}
                        {formatDOB(dob)}
                      </p>
                    )}

                    {getVoterGuardian(voter) && (
                      <p className="text-gray-700">
                        <span className="font-semibold">{t.guardian}:</span>{" "}
                        {getVoterGuardian(voter)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">{t.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
