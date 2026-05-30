"use client";

import { useState, useEffect } from "react";
import {
  parseVoterListResponse,
  getVoterName,
  getVoterId,
  getVoterGuardian,
  getVoterGender,
  getVoterConstituency,
  getVoterWard,
  getVoterImage,
} from "@/lib/voterDisplay";

export default function VoterSearchPage() {
  const [voters, setVoters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("all");

  useEffect(() => {
    fetch("/api/voter-data?type=vidhan-sabha")
      .then((res) => res.json())
      .then((data) => setVoters(parseVoterListResponse(data)))
      .catch((error) => {
        console.error("Failed to fetch voter data:", error);
        setVoters([]);
      });
  }, []);

  const uniqueConstituencies = [
    "all",
    ...new Set(
      voters.map((voter) => getVoterConstituency(voter)?.toLowerCase()).filter(Boolean)
    ),
  ];

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

    return matchesSearchTerm && matchesConstituency;
  });

  return (
    <div className="container mx-auto p-4">
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
            return (
              <div
                key={voter.id || index}
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
                <p className="text-sm text-gray-600">
                  ID: {getVoterId(voter) || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Guardian: {getVoterGuardian(voter) || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Gender: {getVoterGender(voter) || "N/A"}
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
