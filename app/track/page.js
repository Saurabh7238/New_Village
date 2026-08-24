"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/app/theme-provider";
import { getStatusBgClass, formatQueryDate, calculateProgressPercentage, getProgressColor, maskMobile, getTimeRemaining, getSlaDeadline, QUERY_SLA_MATRIX } from "@/lib/queryDisplay";

export default function TrackPage() {
  const { isDark } = useTheme();
  const { status } = useSession();
  const router = useRouter();
  const [queryId, setQueryId] = useState("");
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);

  const bgClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const inputClass = isDark
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-gray-900 border-gray-300";
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  useEffect(() => {
    const savedQueryId = window.sessionStorage.getItem('pendingTrackQueryId');
    if (savedQueryId) setQueryId(savedQueryId);
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setQuery(null);

    if (status !== 'authenticated') {
      window.sessionStorage.setItem('pendingTrackQueryId', queryId);
      setLoginRequired(true);
      setMessage('Please login first to view your personal query status. Your query ID has been saved.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/my-queries');

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.message || "Query not found");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const found = data.queries?.find(q => q.queryId === queryId);

      if (found) {
        window.sessionStorage.removeItem('pendingTrackQueryId');
        setQuery(found);
        setMessage("");
      } else {
        setMessage("No query found with this ID and mobile number");
      }
    } catch (error) {
      console.error("Track Error:", error);
      setMessage("Error fetching query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTimeline = () => {
    if (!query) return [];

    const timeline = [
      { status: "Received", date: query.createdAt, completed: true, icon: "✓" },
      { status: "In Progress", date: null, completed: query.status === "In Progress" || query.status === "Resolved", icon: "⏳" },
      { status: "Resolved", date: query.resolvedAt, completed: query.status === "Resolved", icon: query.status === "Resolved" ? "✓" : "○" }
    ];

    return timeline.filter(item => item.status !== "In Progress" || query.status !== "New");
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${textClass} py-8 px-4`}>
      <div className="max-w-2xl mx-auto">
        {!query ? (
          <div className={`${bgClass} rounded-lg shadow-lg p-8`}>
            <h1 className="text-3xl font-bold mb-2 text-green-700 dark:text-yellow-400">Track Grievance</h1>
            <h2 className="text-xl mb-6 font-semibold">अपनी शिकायत ट्रैक करें</h2>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${message.includes("not found") || message.includes("Error") ? "bg-red-100 text-red-800 dark:bg-red-900" : "bg-blue-100 text-blue-800 dark:bg-blue-900"}`}>
                {message}{loginRequired && <button type="button" onClick={() => router.push('/signin?callbackUrl=%2Ftrack')} className="ml-3 rounded bg-green-700 px-3 py-1 text-sm font-semibold text-white">Login now</button>}
              </div>
            )}

            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Query ID *</label>
                <input
                  type="text"
                  value={queryId}
                  onChange={(e) => setQueryId(e.target.value.toUpperCase())}
                  placeholder="e.g., GP/2026/00125"
                  required
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>


              <button
                type="submit"
                disabled={loading || !queryId}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? "Searching..." : "Track Query"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Query Details Card */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className={`text-sm ${labelClass}`}>Query ID</p>
                  <p className="text-2xl font-bold text-green-600">{query.queryId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBgClass(query.status)}`}>
                  {query.status}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3">{query.subject}</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className={`text-xs ${labelClass}`}>Category</p>
                  <p className="font-semibold">{query.category}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Ward</p>
                  <p className="font-semibold">Ward {query.ward}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Submitted</p>
                  <p className="font-semibold">{formatQueryDate(query.createdAt)}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Assigned To</p>
                  <p className="font-semibold">{query.assignedTo || "Pending"}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">Overall Progress</span>
                  <span className="text-sm font-bold">{calculateProgressPercentage(query.status)}%</span>
                </div>
                <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all bg-gradient-to-r from-${getProgressColor(calculateProgressPercentage(query.status))}-400 to-${getProgressColor(calculateProgressPercentage(query.status))}-600`}
                    style={{ width: `${calculateProgressPercentage(query.status)}%` }}
                  ></div>
                </div>
              </div>

              {/* Admin Remarks */}
              {query.adminRemarks && (
                <div className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-4 rounded-lg mb-4`}>
                  <p className={`text-xs font-semibold ${labelClass}`}>Latest Update</p>
                  <p className="text-sm mt-2">{query.adminRemarks}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6`}>
              <h3 className="text-lg font-bold mb-4">Timeline</h3>
              <div className="space-y-4">
                {getStatusTimeline().map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${item.completed ? "bg-green-500" : "bg-gray-400"}`}>
                        {item.icon}
                      </div>
                      {idx < getStatusTimeline().length - 1 && (
                        <div className={`w-0.5 h-12 ${item.completed ? "bg-green-500" : "bg-gray-400"}`}></div>
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold">{item.status}</p>
                      {item.date ? (
                        <p className={`text-sm ${labelClass}`}>{formatQueryDate(item.date)}</p>
                      ) : (
                        <p className={`text-sm ${labelClass}`}>Pending</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA Info */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6`}>
              <h3 className="text-lg font-bold mb-4">Expected Timeline (SLA)</h3>
              <div className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-4 rounded-lg`}>
                <p className={`text-sm ${labelClass}`}>{query.category} Category</p>
                <p className="font-semibold">Expected Resolution: {formatQueryDate(getSlaDeadline(query.createdAt, query.category))}</p>
              </div>
            </div>

            {/* Download Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={async () => {
                  const res = await fetch(`/api/queries/${query._id}/pdf?type=acknowledgment`);
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `acknowledgment_${query.queryId}.pdf`;
                    link.click();
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
              >
                📥 Acknowledgment
              </button>

              {query.status === "Resolved" && (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/queries/${query._id}/pdf?type=resolution`);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `resolution_${query.queryId}.pdf`;
                      link.click();
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm"
                >
                  📄 Certificate
                </button>
              )}
            </div>

            <button
              onClick={() => setQuery(null)}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
            >
              Track Another Query
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
