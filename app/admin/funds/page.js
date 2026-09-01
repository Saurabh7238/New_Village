"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast, ToastContainer } from "@/components/Toast";
import { FUND_STATUSES, formatFundAmount, formatFundLastUpdated } from "@/lib/fundsDisplay";

export default function AdminFundsPage() {
  const { data: session, status } = useSession();
  const [fundList, setFundList] = useState([]);
  const [fundForm, setFundForm] = useState({
    financialYear: "", schemeName: "", totalAllocation: "", amountReceived: "", status: FUND_STATUSES[0],
    workDescription: "", startDate: "", endDate: "", beneficiaryCount: "", documentData: "", documentName: "", documentMimeType: "application/pdf",
  });
  const [editingFundId, setEditingFundId] = useState(null);
  const [fundPdfFileName, setFundPdfFileName] = useState("No PDF chosen");
  const [removeFundDocument, setRemoveFundDocument] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetch("/api/funds")
      .then((res) => res.json())
      .then((data) => setFundList(Array.isArray(data) ? data : []))
      .catch((err) => { console.error("Error:", err); setFundList([]); });
  }, []);

  const handleFundPdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      addToast("Please upload PDF only.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast("PDF too large (max 10MB).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFundForm((prev) => ({ ...prev, documentData: reader.result, documentName: file.name, documentMimeType: file.type || "application/pdf" }));
      setRemoveFundDocument(false);
      setFundPdfFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submitFund = async (e) => {
    e.preventDefault();
    if (!fundForm.financialYear.trim() || !fundForm.schemeName.trim()) {
      addToast("Financial year and scheme name are required.", "error");
      return;
    }

    const payload = {
      financialYear: fundForm.financialYear.trim(),
      schemeName: fundForm.schemeName.trim(),
      totalAllocation: fundForm.totalAllocation,
      amountReceived: fundForm.amountReceived,
      status: fundForm.status,
      workDescription: fundForm.workDescription.trim(),
      startDate: fundForm.startDate || undefined,
      endDate: fundForm.endDate || undefined,
      beneficiaryCount: fundForm.beneficiaryCount,
    };

    if (fundForm.documentData) {
      payload.documentData = fundForm.documentData;
      payload.documentName = fundForm.documentName;
      payload.documentMimeType = fundForm.documentMimeType;
    }
    if (removeFundDocument) payload.removeDocument = true;
    if (editingFundId) payload.id = editingFundId;

    try {
      const res = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setFundList((prev) => editingFundId ? prev.map((item) => String(item._id) === String(result._id) ? result : item) : [result, ...prev]);
        resetFundForm();
        addToast(editingFundId ? "Fund record updated successfully." : "Fund record added successfully.", "success");
      } else {
        addToast(result.message || "Unable to save fund record.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      addToast("Unable to save fund record.", "error");
    }
  };

  const resetFundForm = () => {
    setEditingFundId(null);
    setFundForm({ financialYear: "", schemeName: "", totalAllocation: "", amountReceived: "", status: FUND_STATUSES[0], workDescription: "", startDate: "", endDate: "", beneficiaryCount: "", documentData: "", documentName: "", documentMimeType: "application/pdf" });
    setFundPdfFileName("No PDF chosen");
    setRemoveFundDocument(false);
  };

  const deleteFund = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch("/api/funds", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) {
        setFundList((prev) => prev.filter((item) => item._id !== id));
        if (editingFundId === id) resetFundForm();
        addToast("Fund record deleted successfully.", "success");
      } else {
        addToast("Unable to delete fund record.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      addToast("Unable to delete fund record.", "error");
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-700 dark:text-yellow-400">Manage Panchayat Funds</h1>
          <button onClick={() => signOut({ callbackUrl: "/?logout=true" })} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">Sign Out</button>
        </div>

        <ToastContainer toasts={toasts} removeToast={removeToast} isDark={true} />

        <form onSubmit={submitFund} className="mb-8 space-y-4 p-4 sm:p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-emerald-700 dark:text-yellow-400">{editingFundId ? "Update" : "Add"} Fund Record</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Financial Year *</label>
              <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="e.g. 2024-25" value={fundForm.financialYear} onChange={(e) => setFundForm({ ...fundForm, financialYear: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Scheme Name *</label>
              <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Fund name" value={fundForm.schemeName} onChange={(e) => setFundForm({ ...fundForm, schemeName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={fundForm.status} onChange={(e) => setFundForm({ ...fundForm, status: e.target.value })}>
                {FUND_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Allocation (₹)</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={fundForm.totalAllocation} onChange={(e) => setFundForm({ ...fundForm, totalAllocation: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount Received (₹)</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={fundForm.amountReceived} onChange={(e) => setFundForm({ ...fundForm, amountReceived: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Beneficiary Count</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={fundForm.beneficiaryCount} onChange={(e) => setFundForm({ ...fundForm, beneficiaryCount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input type="date" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={fundForm.startDate} onChange={(e) => setFundForm({ ...fundForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input type="date" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={fundForm.endDate} onChange={(e) => setFundForm({ ...fundForm, endDate: e.target.value })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-2">Document (PDF)</label>
              <div className="flex items-center gap-2">
                <input type="file" accept=".pdf" onChange={handleFundPdfChange} className="text-xs w-full dark:text-gray-400" />
                {removeFundDocument && <span className="text-xs text-red-500">Pending removal</span>}
              </div>
              {fundForm.documentData && <p className="text-xs mt-1 text-green-600 dark:text-green-400">✓ {fundPdfFileName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Work Description</label>
            <textarea className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" rows="3" placeholder="Fund description" value={fundForm.workDescription} onChange={(e) => setFundForm({ ...fundForm, workDescription: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm font-medium">{editingFundId ? "Update" : "Add"}</button>
            {editingFundId && (
              <>
                <button type="button" onClick={resetFundForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 text-sm font-medium">Cancel</button>
                {fundForm.documentData && (
                  <button type="button" onClick={() => setRemoveFundDocument(true)} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm font-medium">Remove PDF</button>
                )}
              </>
            )}
          </div>
        </form>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="p-3 text-left font-semibold">Year</th>
                  <th className="p-3 text-left font-semibold">Scheme</th>
                  <th className="p-3 text-left font-semibold">Allocation</th>
                  <th className="p-3 text-left font-semibold">Received</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fundList.map((item) => (
                  <tr key={item._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">{item.financialYear}</td>
                    <td className="p-3">{item.schemeName}</td>
                    <td className="p-3">{formatFundAmount(item.totalAllocation)}</td>
                    <td className="p-3">{formatFundAmount(item.amountReceived)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === "Completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : item.status === "In Progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingFundId(item._id); setFundForm(item); }} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                        <button onClick={() => deleteFund(item._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 p-4">
            {fundList.map((item) => (
              <div key={item._id} className="border rounded p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{item.schemeName}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.financialYear}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${item.status === "Completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : item.status === "In Progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}`}>
                    {item.status}
                  </span>
                </div>
                <div className="space-y-2 text-xs mb-3">
                  <p><span className="font-medium">Allocation:</span> {formatFundAmount(item.totalAllocation)}</p>
                  <p><span className="font-medium">Received:</span> {formatFundAmount(item.amountReceived)}</p>
                  {item.beneficiaryCount && <p><span className="font-medium">Beneficiaries:</span> {item.beneficiaryCount}</p>}
                  {item.workDescription && <p><span className="font-medium">Work:</span> {item.workDescription.substring(0, 50)}...</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingFundId(item._id); setFundForm(item); }} className="flex-1 text-blue-500 hover:text-blue-700 text-xs font-medium p-2 border rounded dark:border-gray-600">Edit</button>
                  <button onClick={() => deleteFund(item._id)} className="flex-1 text-red-500 hover:text-red-700 text-xs font-medium p-2 border rounded dark:border-gray-600">Delete</button>
                </div>
              </div>
            ))}
            {fundList.length === 0 && <p className="text-center text-gray-500 text-sm py-8">No fund records found</p>}
          </div>
        </div>

        {fundList.length === 0 && <div className="hidden md:block text-center text-gray-500 py-8">No fund records found</div>}
      </div>
    </div>
  );
}