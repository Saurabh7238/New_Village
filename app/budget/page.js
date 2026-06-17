"use client";

import { useEffect, useState } from "react";
import {
  formatBudgetAmount,
  formatBudgetDate,
  formatLastUpdated,
  getStatusColor,
} from "@/lib/budgetDisplay";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetch("/api/budget")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load budget data");
        return res.json();
      })
      .then((data) => setBudgets(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = async (id, schemeName) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/budget/document?id=${id}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Could not download document");
        return;
      }

      const link = document.createElement("a");
      link.href = data.documentData;
      link.download = data.documentName || `${schemeName || "budget"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const totals = budgets.reduce(
    (acc, item) => ({
      allocation: acc.allocation + (item.totalAllocation || 0),
      received: acc.received + (item.amountReceived || 0),
      balance: acc.balance + (item.balance || 0),
      beneficiaries: acc.beneficiaries + (item.beneficiaryCount || 0),
    }),
    { allocation: 0, received: 0, balance: 0, beneficiaries: 0 }
  );

  return (
    <div className="pt-36 max-w-7xl mx-auto px-4 pb-12">
      <h1 className="text-3xl font-bold text-green-700 mb-2">
        Gram Panchayat Budget
      </h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        View budget allocations, fund receipts, work status, and related documents
        for each scheme.
      </p>

      {!loading && budgets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-600">
            <p className="text-sm text-gray-500">Total Allocation</p>
            <p className="text-xl font-bold text-green-700">
              {formatBudgetAmount(totals.allocation)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-600">
            <p className="text-sm text-gray-500">Amount Received</p>
            <p className="text-xl font-bold text-blue-700">
              {formatBudgetAmount(totals.received)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-orange-600">
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-xl font-bold text-orange-700">
              {formatBudgetAmount(totals.balance)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-600">
            <p className="text-sm text-gray-500">Total Beneficiaries</p>
            <p className="text-xl font-bold text-purple-700">
              {totals.beneficiaries.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-gray-500 text-center py-8">Loading budget data...</p>
      )}

      {error && (
        <p className="text-red-600 bg-red-50 p-4 rounded mb-6">{error}</p>
      )}

      {!loading && !error && budgets.length === 0 && (
        <p className="text-gray-500 text-center py-8 bg-white rounded-lg shadow">
          No budget records published yet.
        </p>
      )}

      {!loading && budgets.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="table-auto w-full text-left text-sm">
            <thead>
              <tr className="bg-green-100 dark:bg-gray-700">
                <th className="px-3 py-3">Financial Year</th>
                <th className="px-3 py-3">Scheme Name</th>
                <th className="px-3 py-3">Total Allocation</th>
                <th className="px-3 py-3">Amount Received</th>
                <th className="px-3 py-3">Balance</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Work Description</th>
                <th className="px-3 py-3">Start Date</th>
                <th className="px-3 py-3">End Date</th>
                <th className="px-3 py-3">Beneficiaries</th>
                <th className="px-3 py-3">Document</th>
                <th className="px-3 py-3">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((item) => (
                <tr
                  key={item._id}
                  className="border-b hover:bg-green-50 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  <td className="px-3 py-3 whitespace-nowrap">{item.financialYear}</td>
                  <td className="px-3 py-3 font-medium">{item.schemeName}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatBudgetAmount(item.totalAllocation)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatBudgetAmount(item.amountReceived)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatBudgetAmount(item.balance)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 max-w-xs">
                    <p className="line-clamp-2" title={item.workDescription}>
                      {item.workDescription || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatBudgetDate(item.startDate)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatBudgetDate(item.endDate)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {item.beneficiaryCount ?? 0}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {item.documentName ? (
                      <button
                        onClick={() => downloadPdf(item._id, item.schemeName)}
                        disabled={downloadingId === item._id}
                        className="text-green-700 hover:underline disabled:opacity-50"
                      >
                        {downloadingId === item._id ? "Loading..." : "Download PDF"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                    {formatLastUpdated(item.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
