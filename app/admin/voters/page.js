"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/app/language-provider";
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
  hasVoterValue,
} from "@/lib/voterDisplay";

const VOTER_TYPE_LABELS = {
  "vidhan-sabha": "Vidhan Sabha",
  "lok-sabha": "Lok Sabha",
  "gram-panchayat": "Gram Panchayat",
};

export default function AdminVotersPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
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

  const [importLoading, setImportLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importCount, setImportCount] = useState(0);
  const [importPreview, setImportPreview] = useState(null);
  const importInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVoterIds, setSelectedVoterIds] = useState([]);
  const [editingVoter, setEditingVoter] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditFields, setBulkEditFields] = useState({});
  const [bulkEditValues, setBulkEditValues] = useState({});
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
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
    setSelectedVoterIds([]);
  }, [voterType, status, session?.user?.role]);

  const filteredVoters = voterList.filter((voter) => {
    const name = `${getVoterName(voter, language)} ${voter.elector_name_en || ""} ${voter.elector_name_hi || ""}`.toLowerCase();
    const guardian = `${getVoterGuardian(voter, language) || ""} ${voter.parent_name_en || ""} ${voter.parent_name_hi || ""}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      (voterName === "" || name.includes(voterName.toLowerCase())) &&
      (voterGuardianName === "" || guardian.includes(voterGuardianName.toLowerCase())) &&
      (search === "" || name.includes(search) || guardian.includes(search))
    );
  });
  const voterQuality = voterList.reduce((summary, voter) => {
    const voterId = String(getVoterId(voter) || "").trim().toUpperCase();
    const voterName = getVoterName(voter, language);
    if (!hasVoterValue(voterId)) summary.missingId += 1;
    if (!hasVoterValue(voterName) || voterName === "Unnamed Voter") summary.missingName += 1;
    if (!hasVoterValue(getVoterHouseNo(voter))) summary.missingHouse += 1;
    if (!hasVoterValue(getVoterGender(voter))) summary.missingGender += 1;
    if (getVoterAge(voter) === null) summary.missingAge += 1;
    if (voterId) {
      summary.ids.set(voterId, (summary.ids.get(voterId) || 0) + 1);
    }
    return summary;
  }, {
    missingId: 0,
    missingName: 0,
    missingHouse: 0,
    missingGender: 0,
    missingAge: 0,
    ids: new Map(),
  });
  const duplicateVoterIds = [...voterQuality.ids.values()]
    .reduce((count, occurrences) => count + Math.max(0, occurrences - 1), 0);
  const votersNeedingReview = voterList.filter((voter) => {
    const voterId = String(getVoterId(voter) || "").trim().toUpperCase();
    return !hasVoterValue(voterId) ||
      !hasVoterValue(getVoterName(voter, language)) ||
      getVoterName(voter, language) === "Unnamed Voter" ||
      !hasVoterValue(getVoterHouseNo(voter)) ||
      !hasVoterValue(getVoterGender(voter)) ||
      getVoterAge(voter) === null ||
      (voterId && voterQuality.ids.get(voterId) > 1);
  }).length;

  const handleDelete = async (voterId, voterRecord) => {
    const idToDelete = voterRecord?._id || voterId;
    if (!window.confirm("Are you sure you want to delete this voter?")) return;
    try {
      const res = await fetch("/api/voter-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idToDelete, type: voterType }),
      });
      if (res.ok) {
        setVoterList((prev) => prev.filter((v) => (v._id || getVoterId(v)) !== idToDelete));
        setSelectedVoterIds((prev) => prev.filter((item) => item !== idToDelete));
        addToast("Voter deleted successfully.", "success");
      } else {
        addToast("Failed to delete voter.", "error");
      }
    } catch (error) {
      addToast("Error deleting voter: " + error.message, "error");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedVoterIds.length) {
      addToast("Select at least one voter to delete.", "warning");
      return;
    }

    if (!window.confirm(`Delete ${selectedVoterIds.length} selected voter(s)?`)) return;

    try {
      const res = await fetch("/api/voter-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedVoterIds, type: voterType }),
      });
      const data = await res.json();

      if (res.ok) {
        setVoterList((prev) => prev.filter((v) => !selectedVoterIds.includes(v._id || getVoterId(v))));
        setSelectedVoterIds([]);
        addToast(data.message || `Deleted ${selectedVoterIds.length} voter(s).`, "success");
      } else {
        addToast(data.error || "Failed to delete selected voters.", "error");
      }
    } catch (error) {
      addToast("Error deleting selected voters: " + error.message, "error");
    }
  };

  const startEditingVoter = (voter) => {
    setEditingVoter(voter);
    setEditForm({
      voterId: getVoterId(voter),
      elector_name_en: voter.elector_name_en || (!voter.elector_name_hi
        ? voter.elector_name || voter.electorName || voter.voterName || voter.name || ""
        : ""),
      elector_name_hi: voter.elector_name_hi || "",
      parent_name_en: voter.parent_name_en || (!voter.parent_name_hi
        ? voter.parent_name || voter.voterGuardianName || ""
        : ""),
      parent_name_hi: voter.parent_name_hi || "",
      serialNumber: getVoterSerialNumber(voter),
      svnNo: voter.svn_no || voter.svnNo || "",
      houseNo: getVoterHouseNo(voter),
      voterWardNo: voter.ward || voter.voterWardNo || "",
      voterConstituency: voter.constituency || voter.voterConstituency || "",
      relationType: getVoterRelationType(voter),
      voterGender: getVoterGender(voter),
      voterAge: getVoterAge(voter) ?? "",
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingVoter || !editForm) return;

    setEditLoading(true);
    try {
      const response = await fetch("/api/voter-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVoter._id || editingVoter.id,
          type: voterType,
          ...editForm,
          voterName: editForm.elector_name_en || editForm.elector_name_hi,
          voterGuardianName: editForm.parent_name_en || editForm.parent_name_hi,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update voter.");

      setVoterList((current) =>
        current.map((voter) =>
          (voter._id || voter.id) === (editingVoter._id || editingVoter.id) ? data : voter
        )
      );
      setEditingVoter(null);
      setEditForm(null);
      addToast("Voter details updated.", "success");
    } catch (error) {
      addToast(error.message || "Failed to update voter.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleBulkEditSubmit = async (event) => {
    event.preventDefault();
    const updates = Object.fromEntries(
      Object.entries(bulkEditFields)
        .filter(([, enabled]) => enabled)
        .map(([field]) => [field, bulkEditValues[field] ?? ""])
    );
    if (!selectedVoterIds.length || !Object.keys(updates).length) {
      addToast("Select voters and at least one field to update.", "warning");
      return;
    }
    if (!window.confirm(`Apply these changes to ${selectedVoterIds.length} selected voter(s)?`)) return;

    setBulkEditLoading(true);
    try {
      const response = await fetch("/api/voter-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedVoterIds, type: voterType, updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Bulk edit failed.");
      const refreshed = await fetch(`/api/voter-data?type=${voterType}`);
      if (!refreshed.ok) throw new Error("Changes saved, but voter list refresh failed.");
      const voters = await refreshed.json();
      setVoterList(Array.isArray(voters) ? voters : []);
      setSelectedVoterIds([]);
      setBulkEditOpen(false);
      setBulkEditFields({});
      setBulkEditValues({});
      addToast(`Updated ${data.modifiedCount} voter(s).`, "success");
    } catch (error) {
      addToast(error.message || "Bulk edit failed.", "error");
    } finally {
      setBulkEditLoading(false);
    }
  };

  const exportFilteredVoters = async (format) => {
    const rows = filteredVoters.map((voter) => ({
      "Voter ID": getVoterId(voter),
      "Name (English)": voter.elector_name_en || getVoterName(voter, "en"),
      "Name (Hindi)": voter.elector_name_hi || "",
      "Guardian (English)": voter.parent_name_en || getVoterGuardian(voter, "en"),
      "Guardian (Hindi)": voter.parent_name_hi || "",
      "Serial Number": getVoterSerialNumber(voter),
      "SVN Number": getVoterSvnNo(voter),
      "House Number": getVoterHouseNo(voter),
      "Ward": voterType === "gram-panchayat" ? getVoterWard(voter) : "",
      "Constituency": voterType === "gram-panchayat" ? "" : voter.constituency || voter.voterConstituency || "",
      "Gender": getVoterGender(voter),
      "Age": getVoterAge(voter) ?? "",
    }));
    if (!rows.length) {
      addToast("No filtered voter records to export.", "warning");
      return;
    }
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");
    XLSX.writeFile(workbook, `voters-${voterType}-${new Date().toISOString().slice(0, 10)}.${format}`);
  };

  const downloadImportErrors = async () => {
    if (!importPreview?.errors?.length) return;
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(importPreview.errors.map((item) => ({
      "Row number": item.row,
      "Validation errors": item.issues.join(" "),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import errors");
    XLSX.writeFile(workbook, `voter-import-errors-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    setImportFile(null);
    setImportCount(0);
    setImportPreview(null);
    setImportMessage("");
    if (!file) return;

    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Import file exceeds the 10 MB limit.");
      const payload = JSON.parse(await file.text());
      const rows = Array.isArray(payload)
        ? payload
        : payload?.electors || payload?.voters;
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("JSON must contain a non-empty electors or voters array.");
      }
      if (rows.length > 5000) {
        throw new Error("Import up to 5,000 voters at a time.");
      }
      setImportFile(file);
      setImportCount(rows.length);
      setPreviewLoading(true);
      const response = await fetch("/api/import-gram-panchayat-voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview", payload }),
      });
      const data = await response.json();
      if (!response.ok && !data.preview) throw new Error(data.error || "Could not preview this file.");
      setImportPreview(data.preview || null);
      if (!data.preview?.validRows) {
        setImportMessage(data.error || "No valid unique voter rows can be imported.");
      }
    } catch (error) {
      setImportMessage(error.message || "Could not read the selected JSON file.");
      setImportFile(null);
      event.target.value = "";
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importFile || voterType !== "gram-panchayat" || !importPreview?.validRows) return;
    if (!window.confirm(
      `Import ${importPreview.validRows} valid unique voter record(s)? ` +
      `${importPreview.existingCount} matching voter ID(s) will be updated. ` +
      `${importPreview.invalidRows + importPreview.duplicateRows} row(s) will be skipped.`
    )) return;

    setImportLoading(true);
    setImportMessage("");
    try {
      const payload = JSON.parse(await importFile.text());
      const res = await fetch("/api/import-gram-panchayat-voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk import failed.");

      setImportMessage(data.message);
      setImportFile(null);
      setImportPreview({
        ...(importPreview || {}),
        totalRows: data.total,
        validRows: data.inserted + data.updated + data.unchanged,
        invalidRows: data.skippedInvalidRows,
        duplicateRows: data.skippedDuplicates,
        existingCount: data.updated + data.unchanged,
        newCount: data.inserted,
        missingFields: data.missingFields,
        errors: data.rowErrors || [],
        errorsTruncated: data.errorsTruncated,
      });
      setSelectedVoterIds([]);
      setSearchTerm("");
      if (importInputRef.current) importInputRef.current.value = "";
      addToast(data.message, "success");
      try {
        const refreshed = await fetch(`/api/voter-data?type=${voterType}`);
        if (!refreshed.ok) throw new Error("Could not refresh the voter list.");
        const refreshedData = await refreshed.json();
        setVoterList(Array.isArray(refreshedData) ? refreshedData : []);
      } catch {
        const warning = `${data.message} Reload the page to refresh the voter list.`;
        setImportMessage(warning);
        addToast(warning, "warning");
      }
    } catch (error) {
      setImportMessage(error.message || "Bulk import failed.");
      addToast(error.message || "Bulk import failed.", "error");
    } finally {
      setImportLoading(false);
    }
  };

  const toggleVoterSelection = (voter) => {
    const key = voter._id || getVoterId(voter);
    setSelectedVoterIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
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

        {voterType === "gram-panchayat" && (
          <section className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Bulk import voters</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Upload a JSON file with an <code>electors</code> or <code>voters</code> array.
                  English and Hindi names and ward numbers are supported.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFileChange}
                  disabled={importLoading || previewLoading}
                  className="max-w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 dark:text-gray-200 dark:file:bg-gray-700"
                  aria-label="Select voter JSON file"
                />
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={!importFile || !importPreview?.validRows || importLoading || previewLoading}
                  className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {previewLoading
                    ? "Checking file..."
                    : importLoading
                      ? "Importing..."
                      : `Import ${importPreview?.validRows ? `(${importPreview.validRows})` : ""}`}
                </button>
              </div>
            </div>
            {importPreview && (
              <div className="mt-4 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                <h3 className="font-semibold">Import preview ({importCount} rows)</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <p>Valid: <strong>{importPreview.validRows}</strong></p>
                  <p>New: <strong>{importPreview.newCount}</strong></p>
                  <p>Existing to update: <strong>{importPreview.existingCount}</strong></p>
                  <p>Invalid: <strong>{importPreview.invalidRows}</strong></p>
                  <p>Duplicate IDs in file: <strong>{importPreview.duplicateRows}</strong></p>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer font-medium">Optional fields missing in valid rows</summary>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-gray-600 dark:text-gray-300 sm:grid-cols-3">
                    <p>Serial number: {importPreview.missingFields?.serialNumber || 0}</p>
                    <p>House number: {importPreview.missingFields?.houseNumber || 0}</p>
                    <p>Guardian name: {importPreview.missingFields?.guardianName || 0}</p>
                    <p>Gender: {importPreview.missingFields?.gender || 0}</p>
                    <p>Age: {importPreview.missingFields?.age || 0}</p>
                  </div>
                </details>
                {importPreview.errors?.length > 0 && (
                  <details className="mt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <summary className="cursor-pointer font-medium text-amber-700 dark:text-amber-300">
                        Invalid rows ({importPreview.invalidRows})
                      </summary>
                      <button type="button" onClick={downloadImportErrors} className="rounded border border-amber-400 px-3 py-1 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                        Download error report
                      </button>
                    </div>
                    <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs text-gray-600 dark:text-gray-300">
                      {importPreview.errors.map((item) => (
                        <li key={item.row}>Row {item.row}: {item.issues.join(" ")}</li>
                      ))}
                    </ul>
                    {importPreview.errorsTruncated && (
                      <p className="mt-1 text-xs">The error report contains all invalid rows.</p>
                    )}
                  </details>
                )}
              </div>
            )}
            {importMessage && (
              <p role="status" className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                {importMessage}
              </p>
            )}
            {selectedVoterIds.length > 0 && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Select voter cards below, then choose Delete selected for bulk removal.
              </p>
            )}
          </section>
        )}

        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-amber-950 dark:text-amber-100">Voter data quality</h2>
            <span className="text-sm text-amber-900 dark:text-amber-200">
              {votersNeedingReview} of {voterList.length} records need review
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-amber-900 dark:text-amber-200 sm:grid-cols-3 lg:grid-cols-6">
            <p>Duplicate IDs: <strong>{duplicateVoterIds}</strong></p>
            <p>Missing IDs: <strong>{voterQuality.missingId}</strong></p>
            <p>Missing names: <strong>{voterQuality.missingName}</strong></p>
            <p>Missing house no.: <strong>{voterQuality.missingHouse}</strong></p>
            <p>Missing gender: <strong>{voterQuality.missingGender}</strong></p>
            <p>Missing age: <strong>{voterQuality.missingAge}</strong></p>
          </div>
        </section>

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
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => exportFilteredVoters("csv")} disabled={loading || !filteredVoters.length} className="rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
              Export CSV
            </button>
            <button type="button" onClick={() => exportFilteredVoters("xlsx")} disabled={loading || !filteredVoters.length} className="rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => setSelectedVoterIds(filteredVoters.map((voter) => voter._id || getVoterId(voter)))}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={!selectedVoterIds.length}
              className="rounded bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete selected ({selectedVoterIds.length})
            </button>
            <button type="button" onClick={() => setBulkEditOpen(true)} disabled={!selectedVoterIds.length} className="rounded bg-blue-700 px-3 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50">
              Bulk edit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {loading ? (
            <div className="p-8 text-center text-sm sm:col-span-2">Loading voters...</div>
          ) : filteredVoters.length === 0 ? (
            <div className="p-8 text-center text-sm sm:col-span-2">No voters found.</div>
          ) : (
            filteredVoters.map((voter) => (
              <div
                key={voter._id || voter.id || getVoterId(voter)}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedVoterIds.includes(voter._id || getVoterId(voter))}
                    onChange={() => toggleVoterSelection(voter)}
                    className="mt-1 h-4 w-4 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label={`Select voter ${getVoterId(voter)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-green-700 dark:text-green-300">
                          {getVoterName(voter, language)}
                        </p>
                        {hasVoterValue(getVoterGuardian(voter, language)) && (
                          <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                            {language === "hi" ? "अभिभावक" : "Guardian"}: {getVoterGuardian(voter, language)}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        {getVoterSerialNumber(voter) || getVoterId(voter)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-2 text-xs dark:border-gray-700">
                      {hasVoterValue(getVoterId(voter)) && <p><strong>ID:</strong> {getVoterId(voter)}</p>}
                      {hasVoterValue(getVoterHouseNo(voter)) && <p><strong>House:</strong> {getVoterHouseNo(voter)}</p>}
                      {hasVoterValue(getVoterWard(voter)) && <p><strong>Ward:</strong> {getVoterWard(voter)}</p>}
                      {hasVoterValue(getVoterGender(voter)) && <p><strong>Gender:</strong> {getVoterGender(voter)}</p>}
                      {getVoterAge(voter) !== null && <p><strong>Age:</strong> {getVoterAge(voter)}</p>}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingVoter(voter)}
                        className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(getVoterId(voter), voter)}
                        className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {bulkEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={handleBulkEditSubmit} aria-labelledby="bulk-edit-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
              <h2 id="bulk-edit-title" className="text-lg font-bold">Bulk edit {selectedVoterIds.length} voters</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Check only the fields to change. A checked blank field clears the current value.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["houseNo", "House number"],
                  ["voterGender", "Gender"],
                  ["voterAge", "Age"],
                  ...(voterType === "gram-panchayat"
                    ? [["voterWardNo", "Ward number"]]
                    : [["voterConstituency", "Constituency"]]),
                ].map(([field, label]) => (
                  <label key={field} className="flex items-start gap-2 rounded border p-3 text-sm dark:border-gray-600">
                    <input type="checkbox" checked={Boolean(bulkEditFields[field])} onChange={(event) => setBulkEditFields((current) => ({ ...current, [field]: event.target.checked }))} className="mt-1 h-4 w-4" />
                    <span className="flex-1">{label}
                      <input
                        type={field === "voterAge" ? "number" : "text"}
                        min={field === "voterAge" ? 0 : undefined}
                        max={field === "voterAge" ? 130 : undefined}
                        value={bulkEditValues[field] || ""}
                        disabled={!bulkEditFields[field]}
                        onChange={(event) => setBulkEditValues((current) => ({ ...current, [field]: event.target.value }))}
                        className="mt-1 block w-full rounded border px-2 py-1.5 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                      />
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkEditOpen(false)} disabled={bulkEditLoading} className="rounded border px-4 py-2 text-sm dark:border-gray-600">Cancel</button>
                <button type="submit" disabled={bulkEditLoading || !Object.values(bulkEditFields).some(Boolean)} className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{bulkEditLoading ? "Updating..." : "Apply changes"}</button>
              </div>
            </form>
          </div>
        )}

        {editingVoter && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form
              onSubmit={handleEditSubmit}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit voter details</h2>
                <button
                  type="button"
                  onClick={() => { setEditingVoter(null); setEditForm(null); }}
                  className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Close edit form"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["voterId", "Voter ID", true],
                  ["elector_name_en", "Name (English)", false],
                  ["elector_name_hi", "Name (Hindi)", false],
                  ["parent_name_en", "Guardian (English)", false],
                  ["parent_name_hi", "Guardian (Hindi)", false],
                  ["serialNumber", "Serial Number", false],
                  ["svnNo", "SVN Number", false],
                  ["houseNo", "House Number", false],
                  ...(voterType === "gram-panchayat"
                    ? [["voterWardNo", "Ward Number", false]]
                    : [["voterConstituency", "Constituency", false]]),
                  ["voterGender", "Gender", false],
                  ["voterAge", "Age", false],
                ].map(([field, label, required]) => (
                  <label key={field} className="grid gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {label}
                    <input
                      type={field === "voterAge" ? "number" : "text"}
                      min={field === "voterAge" ? "0" : undefined}
                      max={field === "voterAge" ? "130" : undefined}
                      value={editForm[field]}
                      required={required}
                      onChange={(event) => setEditForm((current) => ({ ...current, [field]: event.target.value }))}
                      className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    />
                  </label>
                ))}
                <label className="grid gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Relationship type
                  <select
                    value={editForm.relationType}
                    onChange={(event) => setEditForm((current) => ({ ...current, relationType: event.target.value }))}
                    className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">Not specified</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="husband">Husband</option>
                    <option value="wife">Wife</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              {!editForm.elector_name_en.trim() && !editForm.elector_name_hi.trim() && (
                <p className="mt-2 text-sm text-red-600">Provide a name in English or Hindi.</p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingVoter(null); setEditForm(null); }}
                  disabled={editLoading}
                  className="rounded border px-4 py-2 text-sm dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || (!editForm.elector_name_en.trim() && !editForm.elector_name_hi.trim())}
                  className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
