"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function VoterSearchPage() {
  const [voters, setVoters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("all");

  useEffect(() => {
    fetch("/api/voter-data")
      .then((res) => res.json())
      .then((data) => {
        setVoters(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Failed to fetch voter data:", error);
        setVoters([]);
      });
  }, []);

  const uniqueConstituencies = [
    "all",
    ...new Set(voters.map((voter) => voter.constituency)),
  ];

  const filteredVoters = voters.filter((voter) => {
    const name = voter.elector_name?.toLowerCase() || "";
    const id = voter.voter_id?.toLowerCase() || "";
    const constituency = voter.constituency?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearchTerm =
      name.includes(searchLower) || id.includes(searchLower);

    const matchesConstituency =
      selectedConstituency === "all" || constituency === selectedConstituency;

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
          filteredVoters.map((voter) => (
            <div
              key={voter.id}
              className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center"
            >
              {voter.image && (
                <Image
                  src={voter.image}
                  alt={voter.elector_name}
                  width={100}
                  height={100}
                  className="rounded-full w-24 h-24 object-cover mb-2"
                />
              )}
              <h3 className="font-semibold text-lg">{voter.elector_name}</h3>
              <p className="text-sm text-gray-600">ID: {voter.voter_id}</p>
              <p className="text-sm text-gray-600">Gender: {voter.gender}</p>
              {voter.house_number && (
                <p className="text-sm text-gray-600">Ward: {voter.house_number}</p>
              )}
              {voter.constituency && (
                <p className="text-sm text-gray-600">
                  Constituency: {voter.constituency}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No voters found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
