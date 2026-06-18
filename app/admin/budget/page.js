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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-700 dark:text-yellow-400">Manage Budget</h1>
          <button onClick={() => signOut()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sign Out</button>
        </div>

        <form onSubmit={submitBudget} className="mb-8 space-y-4 p-6 border rounded-lg bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-emerald-700 dark:text-yellow-400">{editingBudgetId ? "Update" : "Add"} Budget Record</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Financial Year</label>
              <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. 2024-25" value={budgetForm.financialYear} onChange={(e) => setBudgetForm({ ...budgetForm, financialYear: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheme Name</label>
              <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Scheme name" value={budgetForm.schemeName} onChange={(e) => setBudgetForm({ ...budgetForm, schemeName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Allocation (₹)</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={budgetForm.totalAllocation} onChange={(e) => setBudgetForm({ ...budgetForm, totalAllocation: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount Received (₹)</label>
              <input type="number" min="0" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={budgetForm.amountReceived} onChange={(e) => setBudgetForm({ ...budgetForm, amountReceived: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={budgetForm.status} onChange={(e) => setBudgetForm({ ...budgetForm, status: e.target.value })}>
                {BUDGET_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={budgetForm.startDate} onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })} />
            </div>
          </div>
          <textarea className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3" placeholder="Work description" value={budgetForm.workDescription} onChange={(e) => setBudgetForm({ ...budgetForm, workDescription: e.target.value })} />
          <div className="flex gap-4">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">{editingBudgetId ? "Update" : "Add"}</button>
            {editingBudgetId && (<button type="button" onClick={resetBudgetForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>)}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border dark:border-gray-700">
            <thead className="bg-emerald-50 dark:bg-gray-800">
              <tr>
                <th className="p-2 text-left">Year</th>
                <th className="p-2 text-left">Scheme</th>
                <th className="p-2 text-left">Allocation</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgetList.map((item) => (
                <tr key={item._id} className="border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                  <td className="p-2">{item.financialYear}</td>
                  <td className="p-2">{item.schemeName}</td>
                  <td className="p-2">{formatBudgetAmount(item.totalAllocation)}</td>
                  <td className="p-2">{item.status}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => { setEditingBudgetId(item._id); setBudgetForm(item); }} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                    <button onClick={() => deleteBudget(item._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
