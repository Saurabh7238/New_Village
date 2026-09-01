"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast, ToastContainer } from "@/components/Toast";
import {
  getVoterName,
  getVoterId,
  getVoterGuardian,
  getVoterSerialNumber,
  getVoterHouseNo,
  getVoterRelationship,
  getVoterSvnNo,
  getVoterRelationType,
  getVoterGender,
  getVoterAge,
  getVoterWard,
} from "@/lib/voterDisplay";

const VOTER_TYPE_LABELS = {
  "vidhan-sabha": "Vidhan Sabha",
  "lok-sabha": "Lok Sabha",
  "gram-panchayat": "Gram Panchayat",
};

export default function AdminVotersPage() {
  const { data: session, status } = useSession();
  const [voterList, setVoterList] = useState([]);
  const [voterType, setVoterType] = useState("gram-panchayat");
  const [voterName, setVoterName] = useState("");
  const [voterGuardianName, setVoterGuardianName] = useState("");
  const [relationType, setRelationType] = useState("");
  const [voterGender, setVoterGender] = useState("");
  const [voterAge, setVoterAge] = useState("");
  const [voterWardNo, setVoterWardNo] = useState("");
  const [voterConstituency, setVoterConstituency] = useState("");
  const [voterId, setVoterId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [svnNo, setSvnNo] = useState("");

  const [editingVoterId, setEditingVoterId] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const loadVoters = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/voter-data?type=${voterType}`);
        const data = await res.json();
        setVoterList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading voters:", error);
        setVoterList([]);
      } finally {
        setLoading(false);
      }
    };
    if (status === "authenticated" && session?.user?.role === "admin") {
      loadVoters();
    }
  }, [voterType, status, session?.user?.role]);

  const filteredVoters = voterList.filter((voter) => {
    const name = getVoterName(voter).toLowerCase();
    const guardian = getVoterGuardian(voter)?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return (
      (voterName === "" || name.includes(voterName.toLowerCase())) &&
      (voterGuardianName === "" || guardian.includes(voterGuardianName.toLowerCase())) &&
      (search === "" || name.includes(search) || guardian.includes(search))
    );
  });

  const handleDelete = async (voterId) => {
    if (!window.confirm("Are you sure you want to delete this voter?")) return;
    try {
      const res = await fetch("/api/voter-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, voterType }),
      });
      if (res.ok) {
        setVoterList((prev) => prev.filter((v) => getVoterId(v) !== voterId));
        addToast("Voter deleted successfully.", "success");
      } else {
        addToast("Failed to delete voter.", "error");
      }
    } catch (error) {
      addToast("Error deleting voter: " + error.message, "error");
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen p-8 text-center text-red-600">
        Access denied. You must be an admin.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <ToastContainer toasts={toasts} removeToast={removeToast} isDark={true} />

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-yellow-400">
            Voter Management ({VOTER_TYPE_LABELS[voterType]})
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="self-start rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 rounded-lg bg-white p-4 shadow dark:bg-gray-800 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={voterType}
            onChange={(e) => setVoterType(e.target.value)}
            className="rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            {Object.entries(VOTER_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search voter name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="text-xs sm:text-sm py-2">
            Total: <strong>{filteredVoters.length}</strong> voters
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3">Serial No</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Guardian</th>
                  <th className="p-3">Voter ID</th>
                  <th className="p-3">House No</th>
                  <th className="p-3">Ward</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-sm">
                      Loading voters...
                    </td>
                  </tr>
                ) : filteredVoters.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-sm">
                      No voters found.
                    </td>
                  </tr>
                ) : (
                  filteredVoters.map((voter) => (
                    <tr
                      key={getVoterId(voter)}
                      className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 text-xs">{getVoterSerialNumber(voter)}</td>
                      <td className="p-3 text-xs">{getVoterName(voter)}</td>
                      <td className="p-3 text-xs">{getVoterGuardian(voter)}</td>
                      <td className="p-3 text-xs font-mono">{getVoterId(voter)}</td>
                      <td className="p-3 text-xs">{getVoterHouseNo(voter)}</td>
                      <td className="p-3 text-xs">{getVoterWard(voter)}</td>
                      <td className="p-3 text-xs">{getVoterGender(voter) || "N/A"}</td>
                      <td className="p-3 text-xs">{getVoterAge(voter) || "N/A"}</td>
                      <td className="p-3 text-xs">
                        <button
                          onClick={() => handleDelete(getVoterId(voter))}
                          className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700 whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="p-8 text-center text-sm">Loading voters...</div>
          ) : filteredVoters.length === 0 ? (
            <div className="p-8 text-center text-sm">No voters found.</div>
          ) : (
            filteredVoters.map((voter) => (
              <div
                key={getVoterId(voter)}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-green-700">{getVoterName(voter)}</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Guardian: {getVoterGuardian(voter)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(getVoterId(voter))}
                      className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700 flex-shrink-0 whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-2 grid grid-cols-2 gap-2">
                    <div>
                      <strong>Serial No:</strong> {getVoterSerialNumber(voter)}
                    </div>
                    <div>
                      <strong>Voter ID:</strong> {getVoterId(voter)}
                    </div>
                    <div>
                      <strong>House No:</strong> {getVoterHouseNo(voter)}
                    </div>
                    <div>
                      <strong>Ward:</strong> {getVoterWard(voter)}
                    </div>
                    <div>
                      <strong>Gender:</strong> {getVoterGender(voter) || "N/A"}
                    </div>
                    <div>
                      <strong>Age:</strong> {getVoterAge(voter) || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
