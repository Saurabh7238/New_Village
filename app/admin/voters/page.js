"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
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

  useEffect(() => {
    console.log(`🔄 Fetching voters for type: ${voterType}`);
    fetch(`/api/voter-data?type=${voterType}`)
      .then((res) => {
        console.log(`📊 API Response status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log(`✅ Data received:`, data);
        console.log(`📈 Data count:`, Array.isArray(data) ? data.length : 0);
        const voters = Array.isArray(data) ? data : data.voters || [];
        console.log(`📋 Setting voter list with ${voters.length} voters`);
        setVoterList(voters);
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setVoterList([]);
      });
  }, [voterType]);

  const addOrUpdateVoter = async (e) => {
    e.preventDefault();
    let voterData = {
      type: voterType,
      voterId,
      voterName,
      voterGuardianName,

      // new canonical fields (mapped by API)
      relationType: relationType,
      svnNo: svnNo,

      voterGender,
      ...(voterAge && { voterAge }),
      ...(serialNumber.trim() && { serialNumber: serialNumber.trim() }),
      ...(houseNo.trim() && { houseNo: houseNo.trim() }),
    };
    if (voterType === "gram-panchayat") {
      voterData = { ...voterData, voterWardNo: houseNo || voterWardNo };
    } else {
      voterData = { ...voterData, voterConstituency };
    }

    try {
      const method = editingVoterId ? "PUT" : "POST";
      const endpoint = editingVoterId ? `/api/voter-data` : `/api/voter-data`;
      const payload = editingVoterId ? { ...voterData, id: editingVoterId } : voterData;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || `Failed to ${editingVoterId ? 'update' : 'add'} voter.`);
        return;
      }

      if (editingVoterId) {
        setVoterList((prev) =>
          prev.map((v) => v.id === editingVoterId ? data : v)
        );
        setEditingVoterId(null);
      } else {
        setVoterList((prev) => [data, ...prev]);
      }

      resetForm();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const startEditVoter = (voter) => {
    setEditingVoterId(voter.id);
    setSerialNumber(voter.serialNumber || voter.serial_number || "");
    setHouseNo(voter.houseNo || voter.house_no || "");
    setSvnNo(getVoterSvnNo(voter) || "");
    setRelationType(getVoterRelationType(voter) || "");
    setVoterId(voter.voterId || voter.elector_id || "");
    setVoterName(getVoterName(voter));
    setVoterGuardianName(getVoterGuardian(voter) || "");
    setVoterGender(voter.voterGender || voter.gender || "");
    setVoterAge(String(voter.voterAge || voter.age || ""));
    setVoterWardNo(voter.voterWardNo || voter.ward || voter.house_no || "");
    setVoterConstituency(voter.voterConstituency || voter.constituency || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingVoterId(null);
    setSerialNumber("");
    setHouseNo("");
    setVoterId("");
    setVoterName("");
    setVoterGuardianName("");
    setRelationType("");
    setSvnNo("");
    setVoterGender("");
    setVoterAge("");
    setVoterWardNo("");
    setVoterConstituency("");
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportMessage("");

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      console.log("📥 Importing voters:", data.electors?.length || 0);

      const res = await fetch("/api/import-gram-panchayat-voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      console.log("📤 Import response:", result);

      if (result.success && result.inserted > 0) {
        setImportMessage(`✅ ${result.message}`);

        // Refresh the voter list from database
        setTimeout(async () => {
          const refreshRes = await fetch(`/api/voter-data?type=${voterType}`);
          const refreshedList = await refreshRes.json();
          setVoterList(Array.isArray(refreshedList) ? refreshedList : []);
          setShowImportForm(false);
        }, 500);

        setTimeout(() => setImportMessage(""), 5000);
      } else {
        setImportMessage(`❌ ${result.message || result.error}`);
      }
    } catch (error) {
      console.error("❌ Import error:", error);
      setImportMessage(`❌ Error: ${error.message}`);
    } finally {
      setImportLoading(false);
      e.target.value = "";
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

  const filteredVoters = voterList.filter((voter) => {
    const searchLower = searchTerm.toLowerCase();
    const name = getVoterName(voter)?.toLowerCase() || "";
    const id = getVoterId(voter)?.toLowerCase() || "";
    const guardian = getVoterGuardian(voter)?.toLowerCase() || "";
    return name.includes(searchLower) || id.includes(searchLower) || guardian.includes(searchLower);
  });

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-pink-700 dark:text-yellow-400">Manage Voters</h1>
          <button onClick={() => signOut()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">Sign Out</button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Voter Type</label>
              <select value={voterType} onChange={(e) => setVoterType(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                <option value="gram-panchayat">Gram Panchayat</option>
                <option value="vidhan-sabha">Vidhan Sabha</option>
                <option value="lok-sabha">Lok Sabha</option>
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button onClick={() => setShowImportForm(!showImportForm)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium whitespace-nowrap">
                {showImportForm ? "Cancel" : "Import Bulk"}
              </button>
            </div>
          </div>

          {showImportForm && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-sm">Bulk Import (JSON)</h3>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBulkImport}
                  disabled={importLoading}
                  className="text-sm cursor-pointer"
                />
              </label>
              {importMessage && (
                <p className={`mt-2 text-sm ${importMessage.includes("✅") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {importMessage}
                </p>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Expected format: {"{\"electors\": [{\"serial_number\", \"house_no\", \"elector_name\", \"parent_name\", \"elector_id\", \"gender\", \"age\"}, ...]}"}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={addOrUpdateVoter} className="mb-8 space-y-4 p-4 sm:p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-pink-700 dark:text-yellow-400">
            {editingVoterId ? "Edit Voter" : "Add New Voter"} ({VOTER_TYPE_LABELS[voterType]})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Serial No." value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
           <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="House No." value={houseNo} onChange={(e) => setHouseNo(e.target.value)} />
           <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Voter ID (EPIC / ID)" value={voterId} onChange={(e) => setVoterId(e.target.value)} required />
           <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Voter Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} required />

           <select className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={relationType} onChange={(e) => setRelationType(e.target.value)}>
             <option value="">Relation (Father/Mother/Husband)</option>
             <option value="father">Father</option>
             <option value="mother">Mother</option>
             <option value="husband">Husband</option>
             <option value="wife">Wife</option>
             <option value="other">Other</option>
           </select>

           <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Guardian/Spouse Name" value={voterGuardianName} onChange={(e) => setVoterGuardianName(e.target.value)} />

           <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="SVN / Service Voter No." value={svnNo} onChange={(e) => setSvnNo(e.target.value)} />

           <select className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={voterGender} onChange={(e) => setVoterGender(e.target.value)} required>

             <option value="">Select Gender</option>
             <option value="पुरुष">पुरुष (Male)</option>
             <option value="महिला">महिला (Female)</option>
             <option value="Other">Other</option>
           </select>
           <input type="number" min="0" max="150" className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Age" value={voterAge} onChange={(e) => setVoterAge(e.target.value)} />
           {voterType === "gram-panchayat" ? (
             <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Ward No." value={voterWardNo} onChange={(e) => setVoterWardNo(e.target.value)} />
           ) : (
             <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Constituency" value={voterConstituency} onChange={(e) => setVoterConstituency(e.target.value)} />
           )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 text-sm font-medium">
              {editingVoterId ? "Update Voter" : "Add Voter"}
            </button>
            {editingVoterId && (
              <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 text-sm font-medium">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-lg sm:text-xl font-bold">Voter List ({filteredVoters.length})</h2>
              <input
                type="text"
                placeholder="Search by name, ID, or guardian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-pink-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="p-3 text-left font-semibold">Serial Number</th>
                  <th className="p-3 text-left font-semibold">Name</th>
                  <th className="p-3 text-left font-semibold">SVN No.</th>
                  <th className="p-3 text-left font-semibold">House No.</th>
                  <th className="p-3 text-left font-semibold">Guardian</th>
                  <th className="p-3 text-left font-semibold">Gender</th>
                  <th className="p-3 text-left font-semibold">Age</th>
                  <th className="p-3 text-left font-semibold">Ward/Constituency</th>
                  <th className="p-3 text-left font-semibold">Type</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVoters.map((voter) => (
                  <tr key={voter.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-sm">{getVoterSerialNumber(voter) || "N/A"}</td>
                    <td className="p-3 text-sm font-medium">{getVoterName(voter)}</td>
                    <td className="p-3 text-sm">{getVoterSvnNo(voter) || "N/A"}</td>
                    <td className="p-3 text-sm">{getVoterHouseNo(voter) || "N/A"}</td>
                    <td className="p-3 text-sm">{getVoterGuardian(voter) || "N/A"}</td>
                    <td className="p-3 text-sm">{voter.voterGender || voter.gender || "N/A"}</td>
                    <td className="p-3 text-sm">{voter.voterAge ?? voter.age ?? "N/A"}</td>
                    <td className="p-3 text-sm">
                      {voterType === "gram-panchayat"
                        ? (voter.voterWardNo || voter.ward || voter.house_no || "N/A")
                        : (voter.voterConstituency || voter.constituency || "N/A")}
                    </td>
                    <td className="p-3 text-sm">{voter.type || voterType}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button
                        onClick={() => startEditVoter(voter)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVoter(voter.id || voter._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 p-4">
            {filteredVoters.map((voter) => (
              <div key={voter.id} className="border rounded p-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <h4 className="font-semibold text-sm">{getVoterName(voter)}</h4>
                <div className="space-y-1 text-xs mt-2">
                  <p><span className="font-medium">Serial No.:</span> {getVoterSerialNumber(voter) || "N/A"}</p>
                  <p><span className="font-medium">Voter ID:</span> {getVoterId(voter) || "N/A"}</p>
                  <p><span className="font-medium">SVN No.:</span> {getVoterSvnNo(voter) || "N/A"}</p>
                  <p><span className="font-medium">House No.:</span> {getVoterHouseNo(voter) || "N/A"}</p>
                  <p><span className="font-medium">Guardian:</span> {getVoterGuardian(voter) || "N/A"}</p>
                  <p><span className="font-medium">Gender:</span> {voter.voterGender || voter.gender || "N/A"}</p>
                  <p><span className="font-medium">Age:</span> {voter.voterAge ?? voter.age ?? "N/A"}</p>
                  <p>
                    <span className="font-medium">Ward/Constituency:</span>{" "}
                    {voterType === "gram-panchayat"
                      ? (voter.voterWardNo || voter.ward || voter.house_no || "N/A")
                      : (voter.voterConstituency || voter.constituency || "N/A")}
                  </p>
                  <p><span className="font-medium">Type:</span> {voter.type || voterType}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => startEditVoter(voter)}
                    className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteVoter(voter.id || voter._id)}
                    className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredVoters.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No voters found</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
