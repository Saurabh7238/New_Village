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
  getVoterSerialNumber,
  getVoterHouseNo,
  getVoterSvnNo,
} from "@/lib/voterDisplay";

const VOTER_TYPES = ["gram-panchayat", "vidhan-sabha", "lok-sabha"];

const VOTER_TYPE_LABELS = {
  "vidhan-sabha": "Vidhan Sabha",
  "lok-sabha": "Lok Sabha",
  "gram-panchayat": "Gram Panchayat",
};

async function fetchVotersByType(type) {
  try {
    const res = await fetch(`/api/voter-data?type=${type}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to load ${VOTER_TYPE_LABELS[type]} voters`);
    }
    const data = await res.json();
    return parseVoterListResponse(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`JSON parsing error for ${type}:`, error);
      return []; // Return empty array on JSON parse error
    }
    throw error;
  }
}

export default function VoterSearchPage() {
  const [voters, setVoters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewType, setViewType] = useState("table");
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    console.log("🔄 Fetching all voter types...");
    Promise.allSettled(VOTER_TYPES.map(fetchVotersByType)).then((results) => {
      const merged = [];
      let successCount = 0;
      let failCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`✅ ${VOTER_TYPE_LABELS[VOTER_TYPES[index]]} loaded:`, result.value.length);
          merged.push(...result.value);
          successCount++;
        } else {
          console.error(
            `❌ Failed to fetch ${VOTER_TYPE_LABELS[VOTER_TYPES[index]]} voters:`,
            result.reason
          );
          failCount++;
          if (failCount === VOTER_TYPES.length) {
            setDbError("Database connection failed. Please check MongoDB Atlas connection.");
          }
        }
      });

      console.log(`📊 Total voters loaded: ${merged.length} (${successCount} success, ${failCount} failed)`);
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
    if (category === "male") return "पुरुष";
    if (category === "female") return "महिला";
    return g;
  };

  const filteredVoters = voters.filter((voter) => {
    const name = getVoterName(voter).toLowerCase();
    const id = getVoterId(voter).toLowerCase();
    const guardian = getVoterGuardian(voter)?.toLowerCase() || "";
    const constituency = getVoterConstituency(voter).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearchTerm =
      name.includes(searchLower) || id.includes(searchLower) || guardian.includes(searchLower);

    const matchesConstituency =
      selectedConstituency === "all" ||
      constituency === selectedConstituency.toLowerCase();

    const matchesType =
      typeFilter === "all" || voter.type === typeFilter;

    return matchesSearchTerm && matchesConstituency && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">Voter Search</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by name, voter ID, or guardian..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
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
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
                value={selectedConstituency}
                onChange={(e) => setSelectedConstituency(e.target.value)}
              >
                {uniqueConstituencies.map((c, index) => (
                  <option key={`${c}-${index}`} value={c}>
                    {c === "all" ? "All Constituencies" : c}
                  </option>
                ))}
              </select>
              <div className="hidden lg:flex items-center justify-end text-xs text-gray-600 dark:text-gray-400">
                {filteredVoters.length} voters found
              </div>
            </div>
            <div className="lg:hidden text-sm text-gray-600 dark:text-gray-400">
              {filteredVoters.length} voters found
            </div>
          </div>
        </div>

        {filteredVoters.length > 0 ? (
          <>
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <tr>
                      <th className="p-4 text-left font-semibold">Serial Number</th>
                      <th className="p-4 text-left font-semibold">Name</th>
                      <th className="p-4 text-left font-semibold">SVN No.</th>
                      <th className="p-4 text-left font-semibold">House No.</th>
                      <th className="p-4 text-left font-semibold">Guardian</th>
                      <th className="p-4 text-left font-semibold">Gender</th>
                      <th className="p-4 text-left font-semibold">Age</th>
                      <th className="p-4 text-left font-semibold">Ward/Constituency</th>
                      <th className="p-4 text-left font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVoters.map((voter) => (
                      <tr key={voter.id || voter._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-4 text-sm">{getVoterSerialNumber(voter) || "N/A"}</td>
                        <td className="p-4 text-sm font-medium">{getVoterName(voter)}</td>
                        <td className="p-4 text-sm">{getVoterSvnNo(voter) || "N/A"}</td>
                        <td className="p-4 text-sm">{getVoterHouseNo(voter) || "N/A"}</td>
                        <td className="p-4 text-sm">{getVoterGuardian(voter) || "N/A"}</td>
                        <td className="p-4 text-sm">{normalizeGender(voter)}</td>
                        <td className="p-4 text-sm">{getVoterAge(voter) !== null ? getVoterAge(voter) : "N/A"}</td>
                        <td className="p-4 text-sm">{getVoterWard(voter) || getVoterConstituency(voter) || "N/A"}</td>
                        <td className="p-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                            {VOTER_TYPE_LABELS[voter.type] || voter.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {filteredVoters.map((voter, idx) => (
                <div key={voter.id || voter._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{getVoterName(voter)}</h3>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium whitespace-nowrap ml-2">
                      {VOTER_TYPE_LABELS[voter.type] || voter.type}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Serial No.:</span>
                      <p className="text-gray-600 dark:text-gray-400">{getVoterSerialNumber(voter) || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">SVN No.:</span>
                      <p className="text-gray-600 dark:text-gray-400">{getVoterSvnNo(voter) || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">House No.:</span>
                      <p className="text-gray-600 dark:text-gray-400">{getVoterHouseNo(voter) || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Guardian:</span>
                      <p className="text-gray-600 dark:text-gray-400">{getVoterGuardian(voter) || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Gender:</span>
                      <p className="text-gray-600 dark:text-gray-400">{normalizeGender(voter)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Age:</span>
                      <p className="text-gray-600 dark:text-gray-400">{getVoterAge(voter) !== null ? getVoterAge(voter) : "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Ward/Constituency:</span>
                      <p className="text-gray-600 dark:text-gray-400">{getVoterWard(voter) || getVoterConstituency(voter) || "N/A"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No voters found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
