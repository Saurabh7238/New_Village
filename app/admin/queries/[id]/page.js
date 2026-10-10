"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/app/theme-provider";
import { maskMobile, formatQueryDate, getStatusBgClass, QUERY_STATUSES, QUERY_PRIORITIES } from "@/lib/queryDisplay";

export default function QueryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isDark } = useTheme();
  const { data: session, status: authStatus } = useSession();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const attachmentList = (() => {
    const attachments = Array.isArray(query?.attachments)
      ? query.attachments.filter((attachment) => attachment?.fileUrl || attachment?.url)
      : [];
    const legacyPhoto = query?.photo && !attachments.some((attachment) => (attachment.fileUrl || attachment.url) === query.photo)
      ? [{ fileName: 'Uploaded document', fileUrl: query.photo, mimeType: String(query.photo).startsWith('data:application/pdf') ? 'application/pdf' : 'image/*' }]
      : [];
    return [...attachments, ...legacyPhoto];
  })();

  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    adminRemarks: "",
    internalNotes: "",
    escalate: false
  });

  const bgClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const inputClass = isDark
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-gray-900 border-gray-300";
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";

  const roles = ["Ward Member-1", "Ward Member-2", "Ward Member-3", "Ward Member-4", "Ward Member-5", "Ward Member-6", "Ward Member-7", "Ward Member-8", "Ward Member-9", "Ward Member-10", "Secretary", "JE", "Pradhan"];

  const fetchQuery = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/queries/${params.id}`);
      const data = await res.json();

      if (res.ok) {
        setQuery(data);
        setFormData({
          status: data.status || "New",
          priority: data.priority || "Medium",
          assignedTo: data.assignedTo || "",
          adminRemarks: data.adminRemarks || "",
          internalNotes: data.internalNotes || "",
          escalate: data.escalate || false
        });
        if (data.resolutionPhoto) {
          setPhotoPreview(data.resolutionPhoto);
        }
      } else {
        setMessage("Query not found");
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Error loading query");
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchQuery();
  }, [fetchQuery]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Photo size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/queries/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          priority: formData.priority,
          assignedTo: formData.assignedTo,
          adminRemarks: formData.adminRemarks,
          internalNotes: formData.internalNotes,
          escalate: formData.escalate,
          resolutionPhoto: photoPreview,
          auditEntry: {
            action: "Query updated",
            changedBy: session?.user?.name || "Admin",
            timestamp: new Date()
          }
        })
      });

      if (res.ok) {
        setMessage("Query saved successfully");
        fetchQuery();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error saving query");
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Error saving query");
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (authStatus === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-red-500">
        Access Denied
      </div>
    );
  }

  if (!query) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${textClass} py-8 px-4`}>
        <button onClick={() => router.back()} className="bg-gray-600 text-white px-4 py-2 rounded mb-4">
          ← Back
        </button>
        <div className={`${bgClass} p-8 rounded-lg text-center`}>
          Query not found
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${textClass} py-8 px-4`}>
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="bg-gray-600 text-white px-4 py-2 rounded mb-6">
          ← Back
        </button>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes("Error") ? "bg-red-100 text-red-800 dark:bg-red-900" : "bg-green-100 text-green-800 dark:bg-green-900"}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Details - Left Side */}
          <div className={`lg:col-span-2 space-y-6`}>
            <div className={`${bgClass} p-6 rounded-lg shadow`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className={`text-sm ${labelClass}`}>Query ID</p>
                  <p className="text-3xl font-bold text-green-600">{query.queryId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBgClass(query.status)}`}>
                  {query.status}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-4">{query.subject}</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className={`text-xs ${labelClass}`}>Name</p>
                  <p className="font-semibold">{query.name}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Mobile</p>
                  <p className="font-semibold">{maskMobile(query.mobile)}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Ward</p>
                  <p className="font-semibold">{query.ward}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Category</p>
                  <p className="font-semibold">{query.category}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Address</p>
                  <p className="font-semibold">{query.address || "-"}</p>
                </div>
                <div>
                  <p className={`text-xs ${labelClass}`}>Submitted</p>
                  <p className="font-semibold">{formatQueryDate(query.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className={`text-xs ${labelClass} mb-2`}>Description</p>
                <p className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-4 rounded text-sm`}>
                  {query.description}
                </p>
              </div>

              {attachmentList.length > 0 && (
                <div>
                  <p className={`text-xs ${labelClass} mb-2`}>Uploaded Document(s)</p>
                  <div className="space-y-3">
                    {attachmentList.map((attachment, index) => (
                      <div key={`${attachment.fileName || 'document'}-${index}`} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded p-3`}>
                        <p className="text-sm font-semibold mb-2">{attachment.fileName || `Document ${index + 1}`}</p>
                        {(attachment.fileUrl || attachment.url)?.startsWith('data:application/pdf') || attachment.mimeType?.includes('pdf') ? (
                          <a href={attachment.fileUrl || attachment.url} target="_blank" rel="noreferrer" className="text-blue-600 underline dark:text-blue-400">Open PDF</a>
                        ) : (
                          <Image src={attachment.fileUrl || attachment.url} alt={attachment.fileName || 'Uploaded document'} width={320} height={220} unoptimized className="max-w-xs rounded-lg border border-gray-200 dark:border-gray-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!attachmentList.length && query.photo && (
                <div>
                  <p className={`text-xs ${labelClass} mb-2`}>Citizen Photo/Document</p>
                  <Image src={query.photo} alt="Citizen Photo" width={320} height={220} unoptimized className="max-w-xs rounded-lg" />
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className={`${bgClass} p-6 rounded-lg shadow`}>
              <h3 className="text-lg font-bold mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                {query.acknowledgedAt && (
                  <div className="flex">
                    <span className="text-green-600 mr-3">✓</span>
                    <div>
                      <p className="font-semibold">Acknowledged</p>
                      <p className={labelClass}>{formatQueryDate(query.acknowledgedAt)}</p>
                    </div>
                  </div>
                )}
                {query.resolvedAt && (
                  <div className="flex">
                    <span className="text-green-600 mr-3">✓</span>
                    <div>
                      <p className="font-semibold">Resolved</p>
                      <p className={labelClass}>{formatQueryDate(query.resolvedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Log */}
            {query.auditLog && query.auditLog.length > 0 && (
              <div className={`${bgClass} p-6 rounded-lg shadow`}>
                <h3 className="text-lg font-bold mb-4">Action Log</h3>
                <div className="space-y-3 text-sm max-h-64 overflow-y-auto">
                  {query.auditLog.map((log, idx) => (
                    <div key={idx} className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-3 rounded`}>
                      <div className="flex justify-between">
                        <p className="font-semibold">{log.action}</p>
                        <p className={labelClass}>{formatQueryDate(log.timestamp)}</p>
                      </div>
                      <p className={labelClass}>{log.changedBy}</p>
                      {log.from && log.to && (
                        <p className="text-xs">{log.from} → {log.to}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Actions - Right Side */}
          <div className={`${bgClass} p-6 rounded-lg shadow h-fit sticky top-8`}>
            <h3 className="text-lg font-bold mb-6">Admin Actions</h3>

            <div className="space-y-4">
              <div>
                <label className={`block ${labelClass} mb-2 text-sm font-semibold`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full px-3 py-2 border rounded ${inputClass}`}
                >
                  {QUERY_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 text-sm font-semibold`}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className={`w-full px-3 py-2 border rounded ${inputClass}`}
                >
                  {QUERY_PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 text-sm font-semibold`}>Assigned To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className={`w-full px-3 py-2 border rounded ${inputClass}`}
                >
                  <option value="">Select Officer</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 text-sm font-semibold`}>Admin Remarks (Public)</label>
                <textarea
                  value={formData.adminRemarks}
                  onChange={(e) => setFormData({ ...formData, adminRemarks: e.target.value })}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded ${inputClass}`}
                  placeholder="Visible to citizen"
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 text-sm font-semibold`}>Internal Notes (Private)</label>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded ${inputClass}`}
                  placeholder="Admin only"
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 text-sm font-semibold`}>Resolution Photo/Document</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePhotoUpload}
                  className={`w-full px-3 py-2 border rounded ${inputClass}`}
                />
                {photoPreview && (
                  <Image src={photoPreview} alt="Resolution" width={320} height={220} unoptimized className="mt-3 max-w-xs rounded" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="escalate"
                  checked={formData.escalate}
                  onChange={(e) => setFormData({ ...formData, escalate: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="escalate" className={`text-sm font-semibold ${labelClass}`}>
                  Escalate (SLA Breach)
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 mt-6"
              >
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
