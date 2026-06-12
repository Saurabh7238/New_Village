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
  getVoterWard,
  getVoterImage,
} from "@/lib/voterDisplay";

const VOTER_TYPES = ["vidhan-sabha", "lok-sabha", "gram-panchayat"];

const VOTER_TYPE_LABELS = {
  "vidhan-sabha": "Vidhan Sabha",
  "lok-sabha": "Lok Sabha",
  "gram-panchayat": "Gram Panchayat",
};

async function fetchVotersByType(type) {
  const res = await fetch(`/api/voter-data?type=${type}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load ${VOTER_TYPE_LABELS[type]} voters`);
  const data = await res.json();
  return parseVoterListResponse(data);
}

export default function VoterSearchPage() {
  const [voters, setVoters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    Promise.allSettled(VOTER_TYPES.map(fetchVotersByType)).then((results) => {
      const merged = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          merged.push(...result.value);
        } else {
          console.error(
            `Failed to fetch ${VOTER_TYPE_LABELS[VOTER_TYPES[index]]} voters:`,
            result.reason
          );
        }
      });
      setVoters(merged);
    });
  }, []);

  const uniqueConstituencies = [
    "all",
    ...new Set(
      voters.map((voter) => getVoterConstituency(voter)?.toLowerCase()).filter(Boolean)
    ),
  ];

  const normalizeGender = (voter) => {
    const g = getVoterGender(voter);
    if (!g) return "N/A";
    const category = classifyVoterGender(voter);
    if (category === "male") return "Male";
    if (category === "female") return "Female";
    return g;
  };

  const filteredVoters = voters.filter((voter) => {
    const name = getVoterName(voter).toLowerCase();
    const id = getVoterId(voter).toLowerCase();
    const constituency = getVoterConstituency(voter).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearchTerm =
      name.includes(searchLower) || id.includes(searchLower);

    const matchesConstituency =
      selectedConstituency === "all" ||
      constituency === selectedConstituency.toLowerCase();

    const matchesType =
      typeFilter === "all" || voter.type === typeFilter;

    return matchesSearchTerm && matchesConstituency && matchesType;
  });

  return (
    <div className="container mx-auto p-4 pt-20">
      <h1 className="text-3xl font-bold text-center mb-8">Voter Search</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or voter ID"
          className="w-full md:flex-1 p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="w-full md:w-auto p-2 border border-gray-300 rounded-md"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {VOTER_TYPES.map((type) => (
            <option key={type} value={type}>
              {VOTER_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <select
          className="w-full md:w-auto p-2 border border-gray-300 rounded-md"
          value={selectedConstituency}
          onChange={(e) => setSelectedConstituency(e.target.value)}
        >
          {uniqueConstituencies.map((c, index) => (
            <option key={`${c}-${index}`} value={c}>
              {c === "all" ? "All Constituencies" : c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredVoters.length > 0 ? (
          filteredVoters.map((voter, index) => {
            const imageSrc = getVoterImage(voter);
            const age = getVoterAge(voter);
            return (
              <div
                key={voter.id || `${voter.type}-${index}`}
                className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center"
              >
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt={getVoterName(voter)}
                    className="rounded-full w-24 h-24 object-cover mb-2"
                  />
                )}
                <h3 className="font-semibold text-lg">{getVoterName(voter)}</h3>
                {voter.type && (
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    {VOTER_TYPE_LABELS[voter.type] || voter.type}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  ID: {getVoterId(voter) || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Guardian: {getVoterGuardian(voter) || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Gender: {normalizeGender(voter)}
                </p>
                <p className="text-sm text-gray-600">
                  Age: {age !== null ? age : "N/A"}
                </p>
                {getVoterWard(voter) && (
                  <p className="text-sm text-gray-600">
                    Ward: {getVoterWard(voter)}
                  </p>
                )}
                {getVoterConstituency(voter) && (
                  <p className="text-sm text-gray-600">
                    Constituency: {getVoterConstituency(voter)}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">
              No voters found. Try a different search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
