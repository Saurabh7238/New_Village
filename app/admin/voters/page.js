"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getVoterName, getVoterId, getVoterGuardian } from "@/lib/voterDisplay";

const VOTER_TYPE_LABELS = {
  "vidhan-sabha": "Vidhan Sabha",
  "lok-sabha": "Lok Sabha",
  "gram-panchayat": "Gram Panchayat",
};

export default function AdminVotersPage() {
  const { data: session, status } = useSession();
  const [voterList, setVoterList] = useState([]);
  const [voterType, setVoterType] = useState("vidhan-sabha");
  const [voterName, setVoterName] = useState("");
  const [voterGuardianName, setVoterGuardianName] = useState("");
  const [voterGender, setVoterGender] = useState("");
  const [voterAge, setVoterAge] = useState("");
  const [voterWardNo, setVoterWardNo] = useState("");
  const [voterConstituency, setVoterConstituency] = useState("");
  const [voterId, setVoterId] = useState("");

  useEffect(() => {
    fetch(`/api/voter-data?type=${voterType}`)
      .then((res) => res.json())
      .then((data) => setVoterList(Array.isArray(data) ? data : data.voters || []))
      .catch((err) => { console.error("Error:", err); setVoterList([]); });
  }, [voterType]);

  const addVoter = async (e) => {
    e.preventDefault();
    let voterData = {
      type: voterType,
      voterId,
      voterName,
      voterGuardianName,
      voterGender,
      ...(voterAge.trim() && { voterAge: voterAge.trim() }),
    };
    if (voterType === "gram-panchayat") {
      voterData = { ...voterData, voterWardNo };
    } else {
      voterData = { ...voterData, voterConstituency };
    }

    try {
      const res = await fetch("/api/voter-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voterData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add voter.");
        return;
      }
      setVoterList((prev) => [data, ...prev]);
      setVoterName("");
      setVoterGuardianName("");
      setVoterGender("");
      setVoterAge("");
      setVoterWardNo("");
      setVoterConstituency("");
      setVoterId("");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteVoter = async (id) => {
    if (!confirm("Delete this voter?")) return;
    try {
      const res = await fetch("/api/voter-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: voterType }),
      });
      if (res.ok) {
        setVoterList((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-pink-700 dark:text-yellow-400">Manage Voters</h1>
          <button onClick={() => signOut()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sign Out</button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Voter Type</label>
          <select value={voterType} onChange={(e) => setVoterType(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="vidhan-sabha">Vidhan Sabha</option>
            <option value="lok-sabha">Lok Sabha</option>
            <option value="gram-panchayat">Gram Panchayat</option>
          </select>
        </div>

        <form onSubmit={addVoter} className="mb-8 space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-pink-700 dark:text-yellow-400">Add New Voter ({VOTER_TYPE_LABELS[voterType]})</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Voter ID" value={voterId} onChange={(e) => setVoterId(e.target.value)} required />
            <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} required />
            <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Guardian's Name" value={voterGuardianName} onChange={(e) => setVoterGuardianName(e.target.value)} />
            <select className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={voterGender} onChange={(e) => setVoterGender(e.target.value)} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="number" min="0" max="150" className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Age" value={voterAge} onChange={(e) => setVoterAge(e.target.value)} />
            {voterType === "gram-panchayat" ? (
              <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ward No." value={voterWardNo} onChange={(e) => setVoterWardNo(e.target.value)} />
            ) : (
              <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Constituency" value={voterConstituency} onChange={(e) => setVoterConstituency(e.target.value)} />
            )}
          </div>
          <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">Add Voter</button>
        </form>

        <h2 className="text-2xl font-bold mb-4">Voter List ({voterList.length})</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {voterList.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">No voters for this type yet.</p>
          ) : (
            voterList.map((voter) => (
              <div key={voter.id} className="border rounded p-3 flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700">
                <div>
                  <h4 className="font-bold">{getVoterName(voter)} ({getVoterId(voter) || "N/A"})</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Guardian: {getVoterGuardian(voter) || "N/A"}</p>
                </div>
                <button onClick={() => deleteVoter(voter.id)} className="text-red-500 hover:text-red-700 text-sm shrink-0">Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
