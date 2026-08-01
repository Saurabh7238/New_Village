"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { BUDGET_STATUSES, formatBudgetAmount, formatLastUpdated } from "@/lib/budgetDisplay";

export default function AdminBudgetPage() {
  const { data: session, status } = useSession();
  const [budgetList, setBudgetList] = useState([]);
  const [budgetForm, setBudgetForm] = useState({
    financialYear: "", schemeName: "", totalAllocation: "", amountReceived: "", status: BUDGET_STATUSES[0],
    workDescription: "", startDate: "", endDate: "", beneficiaryCount: "", documentData: "", documentName: "", documentMimeType: "application/pdf",
  });
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [budgetPdfFileName, setBudgetPdfFileName] = useState("No PDF chosen");
  const [removeBudgetDocument, setRemoveBudgetDocument] = useState(false);

  useEffect(() => {
    fetch("/api/budget")
      .then((res) => res.json())
      .then((data) => setBudgetList(Array.isArray(data) ? data : []))
      .catch((err) => { console.error("Error:", err); setBudgetList([]); });
  }, []);

  const handleBudgetPdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload PDF only.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("PDF too large (max 10MB).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBudgetForm((prev) => ({ ...prev, documentData: reader.result, documentName: file.name, documentMimeType: file.type || "application/pdf" }));
      setRemoveBudgetDocument(false);
      setBudgetPdfFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submitBudget = async (e) => {
    e.preventDefault();
    if (!budgetForm.financialYear.trim() || !budgetForm.schemeName.trim()) {
      alert("Financial year and scheme name required.");
      return;
    }

    const payload = {
      financialYear: budgetForm.financialYear.trim(),
      schemeName: budgetForm.schemeName.trim(),
      totalAllocation: budgetForm.totalAllocation,
      amountReceived: budgetForm.amountReceived,
      status: budgetForm.status,
      workDescription: budgetForm.workDescription.trim(),
      startDate: budgetForm.startDate || undefined,
      endDate: budgetForm.endDate || undefined,
      beneficiaryCount: budgetForm.beneficiaryCount,
    };

    if (budgetForm.documentData) {
      payload.documentData = budgetForm.documentData;
      payload.documentName = budgetForm.documentName;
      payload.documentMimeType = budgetForm.documentMimeType;
    }
    if (removeBudgetDocument) payload.removeDocument = true;
    if (editingBudgetId) payload.id = editingBudgetId;

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setBudgetList((prev) => editingBudgetId ? prev.map((item) => String(item._id) === String(result._id) ? result : item) : [result, ...prev]);
        resetBudgetForm();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const resetBudgetForm = () => {
    setEditingBudgetId(null);
    setBudgetForm({ financialYear: "", schemeName: "", totalAllocation: "", amountReceived: "", status: BUDGET_STATUSES[0], workDescription: "", startDate: "", endDate: "", beneficiaryCount: "", documentData: "", documentName: "", documentMimeType: "application/pdf" });
    setBudgetPdfFileName("No PDF chosen");
    setRemoveBudgetDocument(false);
  };

  const deleteBudget = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch("/api/budget", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) {
        setBudgetList((prev) => prev.filter((item) => item._id !== id));
        if (editingBudgetId === id) resetBudgetForm();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-700 dark:text-yellow-400">Manage Budget</h1>
          <button onClick={() => signOut({ callbackUrl: "/?logout=true" })} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">Sign Out</button>
        </div>

        <form onSubmit={submitBudget} className="mb-8 space-y-4 p-4 sm:p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-emerald-700 dark:text-yellow-400">{editingBudgetId ? "Update" : "Add"} Budget Record</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Financial Year *</label>
              <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="e.g. 2024-25" value={budgetForm.financialYear} onChange={(e) => setBudgetForm({ ...budgetForm, financialYear: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Scheme Name *</label>
              <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Scheme name" value={budgetForm.schemeName} onChange={(e) => setBudgetForm({ ...budgetForm, schemeName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={budgetForm.status} onChange={(e) => setBudgetForm({ ...budgetForm, status: e.target.value })}>
                {BUDGET_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Allocation (₹)</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={budgetForm.totalAllocation} onChange={(e) => setBudgetForm({ ...budgetForm, totalAllocation: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount Received (₹)</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={budgetForm.amountReceived} onChange={(e) => setBudgetForm({ ...budgetForm, amountReceived: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Beneficiary Count</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={budgetForm.beneficiaryCount} onChange={(e) => setBudgetForm({ ...budgetForm, beneficiaryCount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input type="date" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={budgetForm.startDate} onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input type="date" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" value={budgetForm.endDate} onChange={(e) => setBudgetForm({ ...budgetForm, endDate: e.target.value })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-2">Document (PDF)</label>
              <div className="flex items-center gap-2">
                <input type="file" accept=".pdf" onChange={handleBudgetPdfChange} className="text-xs w-full dark:text-gray-400" />
                {removeBudgetDocument && <span className="text-xs text-red-500">Pending removal</span>}
              </div>
              {budgetForm.documentData && <p className="text-xs mt-1 text-green-600 dark:text-green-400">✓ {budgetPdfFileName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Work Description</label>
            <textarea className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" rows="3" placeholder="Work description" value={budgetForm.workDescription} onChange={(e) => setBudgetForm({ ...budgetForm, workDescription: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm font-medium">{editingBudgetId ? "Update" : "Add"}</button>
            {editingBudgetId && (
              <>
                <button type="button" onClick={resetBudgetForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 text-sm font-medium">Cancel</button>
                {budgetForm.documentData && (
                  <button type="button" onClick={() => setRemoveBudgetDocument(true)} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm font-medium">Remove PDF</button>
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
                {budgetList.map((item) => (
                  <tr key={item._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">{item.financialYear}</td>
                    <td className="p-3">{item.schemeName}</td>
                    <td className="p-3">{formatBudgetAmount(item.totalAllocation)}</td>
                    <td className="p-3">{formatBudgetAmount(item.amountReceived)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : item.status === "Completed" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingBudgetId(item._id); setBudgetForm(item); }} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                        <button onClick={() => deleteBudget(item._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 p-4">
            {budgetList.map((item) => (
              <div key={item._id} className="border rounded p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{item.schemeName}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.financialYear}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${item.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : item.status === "Completed" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}`}>
                    {item.status}
                  </span>
                </div>
                <div className="space-y-2 text-xs mb-3">
                  <p><span className="font-medium">Allocation:</span> {formatBudgetAmount(item.totalAllocation)}</p>
                  <p><span className="font-medium">Received:</span> {formatBudgetAmount(item.amountReceived)}</p>
                  {item.beneficiaryCount && <p><span className="font-medium">Beneficiaries:</span> {item.beneficiaryCount}</p>}
                  {item.workDescription && <p><span className="font-medium">Work:</span> {item.workDescription.substring(0, 50)}...</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingBudgetId(item._id); setBudgetForm(item); }} className="flex-1 text-blue-500 hover:text-blue-700 text-xs font-medium p-2 border rounded dark:border-gray-600">Edit</button>
                  <button onClick={() => deleteBudget(item._id)} className="flex-1 text-red-500 hover:text-red-700 text-xs font-medium p-2 border rounded dark:border-gray-600">Delete</button>
                </div>
              </div>
            ))}
            {budgetList.length === 0 && <p className="text-center text-gray-500 text-sm py-8">No budget records found</p>}
          </div>
        </div>

        {budgetList.length === 0 && <div className="hidden md:block text-center text-gray-500 py-8">No budget records found</div>}
      </div>
    </div>
  );
}
