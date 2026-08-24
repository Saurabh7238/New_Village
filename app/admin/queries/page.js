"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/app/theme-provider";
import { maskMobile, formatQueryDate, QUERY_CATEGORIES, QUERY_STATUSES, QUERY_PRIORITIES } from "@/lib/queryDisplay";
import { useToast, ToastContainer } from "@/components/Toast";
import { checkSlaBreach } from "@/lib/escalationRules";

export default function AdminQueriesPage() {
  const { isDark } = useTheme();
  const { data: session, status: authStatus } = useSession();
  const { toasts, addToast, removeToast } = useToast();
  const [queries, setQueries] = useState([]);
  const [lastKnownQueries, setLastKnownQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0, pending: 0, overdue: 0 });

  const [filters, setFilters] = useState({
    search: "",
    ward: "",
    category: "",
    status: "",
    assignedTo: "",
    priority: "",
    dateFrom: "",
    dateTo: ""
  });

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [page, setPage] = useState(1);
  const perPage = 10;

  const bgClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const inputClass = isDark
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-gray-900 border-gray-300";
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";

  // Polling effect for new queries
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const interval = setInterval(() => {
      fetchQueries();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [authStatus, filters]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.ward) params.append("ward", filters.ward);
      if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);
      if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      params.append("page", String(page));
      params.append("limit", "25");

      const res = await fetch(`/api/queries?${params.toString()}`);
      const data = await res.json();

      const queryList = Array.isArray(data) ? data : data.queries;
      if (Array.isArray(queryList)) {
        setQueries(queryList);
        calculateStats(queryList);
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Error loading queries");
      setLoading(false);
    }
  };

  const calculateStats = (queriesData) => {
    const stats = {
      total: queriesData.length,
      new: queriesData.filter(q => q.status === "New").length,
      inProgress: queriesData.filter(q => q.status === "In Progress").length,
      resolved: queriesData.filter(q => q.status === "Resolved").length,
      pending: queriesData.filter(q => ["New", "In Progress"].includes(q.status)).length,
      overdue: queriesData.filter(q => q.escalate === true).length
    };
    setStats(stats);

    // Check for new queries
    if (lastKnownQueries.length > 0) {
      const newQueries = queriesData.filter(q => !lastKnownQueries.find(lq => lq._id === q._id));
      newQueries.forEach(q => {
        addToast(`🔔 New Query ${q.queryId} - ${q.category} in Ward ${q.ward}`, "warning", 6000);
      });

      // Check for SLA breaches
      queriesData.forEach(q => {
        const lastQ = lastKnownQueries.find(lq => lq._id === q._id);
        if (lastQ && !lastQ.escalate && q.escalate) {
          addToast(`⚠️ Query ${q.queryId} SLA BREACHED - Action required!`, "error", 8000);
        }
      });
    }

    setLastKnownQueries(queriesData);
  };

  const handleStatusChange = async (queryId, newStatus) => {
    try {
      const res = await fetch(`/api/queries/${queryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          auditEntry: { action: `Status changed to ${newStatus}`, changedBy: session?.user?.name || "Admin" }
        })
      });

      if (res.ok) {
        fetchQueries();
        setMessage("Query updated successfully");
      } else {
        setMessage("Error updating query");
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Error updating query");
    }
  };

  const handlePriorityChange = async (queryId, newPriority) => {
    try {
      const res = await fetch(`/api/queries/${queryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: newPriority,
          auditEntry: { action: `Priority changed to ${newPriority}`, changedBy: session?.user?.name || "Admin" }
        })
      });

      if (res.ok) {
        fetchQueries();
      } else {
        setMessage("Error updating priority");
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Error updating priority");
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/queries/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `queries_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
      }
    } catch (error) {
      console.error("Export error:", error);
      setMessage("Error exporting queries");
    }
  };

  const toggleRowSelection = (queryId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(queryId)) {
      newSelected.delete(queryId);
    } else {
      newSelected.add(queryId);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === queries.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(queries.map(q => q._id)));
    }
  };

  if (authStatus === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (authStatus === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-red-500">
        Access Denied
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${textClass} py-8 px-4`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} isDark={isDark} />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 dark:text-yellow-400">Query Management</h1>
          <Link href="/admin" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
            ← Back to Admin
          </Link>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${message.includes("Error") ? "bg-red-100 text-red-800 dark:bg-red-900" : "bg-green-100 text-green-800 dark:bg-green-900"}`}>
            {message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className={`${bgClass} p-4 rounded-lg shadow`}>
            <p className={`text-xs ${labelClass}`}>Total</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow`}>
            <p className={`text-xs ${labelClass}`}>New</p>
            <p className="text-2xl font-bold text-orange-600">{stats.new}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow`}>
            <p className={`text-xs ${labelClass}`}>In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow`}>
            <p className={`text-xs ${labelClass}`}>Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow`}>
            <p className={`text-xs ${labelClass}`}>Pending</p>
            <p className="text-2xl font-bold text-purple-600">{stats.pending}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow`}>
            <p className={`text-xs ${labelClass}`}>Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${bgClass} p-6 rounded-lg shadow mb-6`}>
          <h3 className="text-lg font-bold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search Query ID / Name / Mobile"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              className={`px-3 py-2 border rounded ${inputClass}`}
            />
            <select
              value={filters.ward}
              onChange={(e) => { setFilters({ ...filters, ward: e.target.value }); setPage(1); }}
              className={`px-3 py-2 border rounded ${inputClass}`}
            >
              <option value="">All Wards</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => (
                <option key={w} value={w}>Ward {w}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
              className={`px-3 py-2 border rounded ${inputClass}`}
            >
              <option value="">All Categories</option>
              {QUERY_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className={`px-3 py-2 border rounded ${inputClass}`}
            >
              <option value="">All Status</option>
              {QUERY_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}
              className={`px-3 py-2 border rounded ${inputClass}`}
            >
              <option value="">All Priority</option>
              {QUERY_PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => { setFilters({ ...filters, dateFrom: e.target.value }); setPage(1); }}
              className={`px-3 py-2 border rounded ${inputClass}`}
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => { setFilters({ ...filters, dateTo: e.target.value }); setPage(1); }}
              className={`px-3 py-2 border rounded ${inputClass}`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            📥 Export to Excel
          </button>
        </div>

        {/* Table */}
        <div className={`${bgClass} rounded-lg shadow overflow-x-auto`}>
          <table className="w-full">
            <thead className={`${isDark ? "bg-gray-700" : "bg-gray-100"} border-b`}>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === queries.length && queries.length > 0}
                    onChange={toggleAllRows}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold">Query ID</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Mobile</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Ward</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Category</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Assigned To</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Created</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="px-4 py-8 text-center">Loading...</td></tr>
              ) : queries.length === 0 ? (
                <tr><td colSpan="11" className="px-4 py-8 text-center">No queries found</td></tr>
              ) : (
                queries.map(query => (
                  <tr key={query._id} className={`border-b ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(query._id)}
                        onChange={() => toggleRowSelection(query._id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">{query.queryId}</td>
                    <td className="px-4 py-3 text-sm">{query.name}</td>
                    <td className="px-4 py-3 text-sm">{maskMobile(query.mobile)}</td>
                    <td className="px-4 py-3 text-sm">{query.ward}</td>
                    <td className="px-4 py-3 text-sm">{query.category}</td>
                    <td className="px-4 py-3">
                      <select
                        value={query.status}
                        onChange={(e) => handleStatusChange(query._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border ${inputClass}`}
                      >
                        {QUERY_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={query.priority || "Medium"}
                        onChange={(e) => handlePriorityChange(query._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border ${inputClass}`}
                      >
                        {QUERY_PRIORITIES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">{query.assignedTo || "-"}</td>
                    <td className="px-4 py-3 text-xs">{formatQueryDate(query.createdAt)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/admin/queries/${query._id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
