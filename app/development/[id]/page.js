"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { formatDate, formatCurrency, calculateDaysRemaining, getStatusBgClass } from "@/lib/developmentDisplay";
import { useTheme } from "@/app/theme-provider";
import DevelopmentMap from "@/components/DevelopmentMap";

export default function DevelopmentDetailPage({ params }) {
  const { isDark } = useTheme();
  const { data: session, status: sessionStatus } = useSession();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoUpdates, setPhotoUpdates] = useState([]);
  const [approvedReports, setApprovedReports] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [reportCategory, setReportCategory] = useState("Stalled work");
  const [reportDescription, setReportDescription] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/development?id=${params.id}`);
      const data = await res.json();
      const foundProject = Array.isArray(data) ? data[0] : data;
      setProject(foundProject);
      if (foundProject?._id) {
        const [updatesResponse, reportsResponse, qrResponse] = await Promise.all([
          fetch(`/api/development/${foundProject._id}/updates`),
          fetch(`/api/development-reports?projectId=${foundProject._id}`),
          fetch(`/api/qrcode/generate?type=development&id=${foundProject._id}`),
        ]);
        if (!updatesResponse.ok || !reportsResponse.ok || !qrResponse.ok) {
          throw new Error("Some project transparency details could not be loaded.");
        }
        const [updates, reports, qr] = await Promise.all([
          updatesResponse.json(),
          reportsResponse.json(),
          qrResponse.json(),
        ]);
        setPhotoUpdates(updates);
        setApprovedReports(reports);
        setQrCode(qr.qrCode);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${isDark ? "text-white" : "text-gray-900"} flex items-center justify-center`}>
        <div className="text-xl">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${isDark ? "text-white" : "text-gray-900"} flex items-center justify-center`}>
        <div className="text-xl">Project not found</div>
      </div>
    );
  }

  const photos = [
    ...(project.beforePhoto ? [{ src: project.beforePhoto, label: "Before" }] : []),
    ...(project.afterPhoto ? [{ src: project.afterPhoto, label: "After" }] : []),
    ...photoUpdates.map((update) => ({
      src: update.photo,
      label: `${formatDate(update.updateDate)} — ${update.description}`,
    })),
  ];

  const submitReport = async (event) => {
    event.preventDefault();
    setReportMessage("");
    setSubmittingReport(true);
    try {
      const response = await fetch("/api/development-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project._id, category: reportCategory, description: reportDescription }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not submit report.");
      setReportDescription("");
      setReportMessage("Thank you. Your report has been sent to the Panchayat for review.");
    } catch (error) {
      setReportMessage(error.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const daysRemaining = calculateDaysRemaining(project.expectedCompletion);
  const budgetUtilization = project.sanctionedAmount > 0 ? ((project.amountSpent / project.sanctionedAmount) * 100).toFixed(1) : 0;

  const bgClass = isDark ? "bg-gray-800" : "bg-white";
  const textMutedClass = isDark ? "text-gray-400" : "text-gray-600";
  const borderClass = isDark ? "border-gray-700" : "border-gray-300";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${isDark ? "text-white" : "text-gray-900"}`}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/development" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Back to Projects
          </Link>
          <h1 className="text-4xl font-bold mb-4 text-green-700 dark:text-yellow-400">{project.title}</h1>
          <div className="flex gap-4 items-center">
            <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusBgClass(project.status)}`}>
              {project.status}
            </span>
            <span className={`text-lg font-semibold ${textMutedClass}`}>{project.scheme}</span>
            <span className={`text-lg font-semibold ${textMutedClass}`}>Ward {project.wardNo}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Photo Carousel */}
            {photos.length > 0 && (
              <div className={`${bgClass} rounded-lg shadow-lg overflow-hidden mb-8`}>
                <div className="relative bg-gray-300 dark:bg-gray-700 h-96">
                  <Image src={photos[photoIndex].src} alt={photos[photoIndex].label} fill unoptimized className="object-cover" />
                  <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {photos[photoIndex].label}
                  </div>
                </div>
                {photos.length > 1 && (
                  <div className="flex justify-between items-center p-4">
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm font-semibold">
                      {photoIndex + 1} / {photos.length}
                    </span>
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev + 1) % photos.length)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div className={`${bgClass} rounded-lg shadow-lg p-6 mb-8`}>
                <h2 className="text-xl font-bold mb-4">Project Description</h2>
                <p className={textMutedClass}>{project.description}</p>
              </div>
            )}

            {/* Progress Timeline */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6 mb-8`}>
              <h2 className="text-xl font-bold mb-6">Project Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold">Sanctioned</p>
                    <p className={textMutedClass}>{formatDate(project.startDate)}</p>
                    <p className="text-sm mt-1">{formatCurrency(project.sanctionedAmount)} sanctioned</p>
                  </div>
                  {project.updateHistory?.length > 0 && (
                    <div className={`mt-6 border-t ${borderClass} pt-5`}>
                      <h3 className="mb-3 font-bold">Progress and finance history</h3>
                      <ol className="space-y-3">
                        {[...project.updateHistory].reverse().map((entry, index) => (
                          <li key={`${entry.updatedAt}-${index}`} className={`border-l-2 border-green-600 pl-4 ${textMutedClass}`}>
                            <p className="font-semibold">{formatDate(entry.updatedAt)}</p>
                            {entry.changes?.map((change) => (
                              <p key={change.field}>
                                {change.field === "physicalProgress" ? "Progress" : change.field === "amountSpent" ? "Amount spent" : "Status"}:{" "}
                                {change.field === "amountSpent" ? formatCurrency(change.from) : change.from}
                                {" → "}
                                {change.field === "amountSpent" ? formatCurrency(change.to) : change.to}
                                {change.field === "physicalProgress" ? "%" : ""}
                              </p>
                            ))}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {photoUpdates.length > 0 && (
                  <section className={`${bgClass} mb-8 rounded-lg p-6 shadow-lg`}>
                    <h2 className="mb-4 text-xl font-bold">Dated site photo updates</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {photoUpdates.map((update) => (
                        <article key={update._id}>
                          <Image src={update.photo} alt={update.description} width={640} height={400} unoptimized className="h-52 w-full rounded-lg object-cover" />
                          <p className="mt-2 font-semibold">{formatDate(update.updateDate)}</p>
                          <p className={textMutedClass}>{update.description}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${project.status === "Ongoing" || project.status === "Completed" ? "bg-blue-600" : "bg-gray-400"} text-white flex items-center justify-center font-bold flex-shrink-0`}>
                    ▶
                  </div>
                  <div>
                    <p className="font-semibold">Started</p>
                    <p className={textMutedClass}>{formatDate(project.startDate)}</p>
                    <p className="text-sm mt-1">Physical Progress: {project.physicalProgress}%</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${project.status === "Completed" ? "bg-emerald-600" : "bg-gray-400"} text-white flex items-center justify-center font-bold flex-shrink-0`}>
                    🎯
                  </div>
                  <div>
                    <p className="font-semibold">Expected Completion</p>
                    <p className={textMutedClass}>{formatDate(project.expectedCompletion)}</p>
                    <p className="text-sm mt-1">{daysRemaining > 0 ? `${daysRemaining} days remaining` : "Overdue"}</p>
                  </div>
                </div>

                {project.actualCompletion && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold">Completed</p>
                      <p className={textMutedClass}>{formatDate(project.actualCompletion)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6 mb-8`}>
              <h2 className="text-xl font-bold mb-6">Financial Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className={`text-sm font-semibold ${textMutedClass}`}>Sanctioned Amount</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(project.sanctionedAmount)}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textMutedClass}`}>Amount Spent</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(project.amountSpent)}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textMutedClass}`}>Remaining</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {formatCurrency(project.sanctionedAmount - project.amountSpent)}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textMutedClass}`}>Budget Utilization</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">{budgetUtilization}%</p>
                </div>
              </div>

              {/* Budget Utilization Bar */}
              <div className="mt-6">
                <p className="text-sm font-semibold mb-2">Spending Progress</p>
                <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                    style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6`}>
              <h2 className="text-xl font-bold mb-4">Documents</h2>
              <div className="space-y-3">
                {project.workOrderPDF?.data && (
                  <a
                    href={project.workOrderPDF.data}
                    download={project.workOrderPDF.name}
                    className="flex items-center gap-3 p-3 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition"
                  >
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-100">Work Order</p>
                      <p className="text-xs text-red-700 dark:text-red-300">{project.workOrderPDF.name}</p>
                    </div>
                  </a>
                )}
                {project.socialAuditReport?.data && (
                  <a
                    href={project.socialAuditReport.data}
                    download={project.socialAuditReport.name}
                    className="flex items-center gap-3 p-3 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition"
                  >
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Social Audit Report</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">{project.socialAuditReport.name}</p>
                    </div>
                  </a>
                )}
                {!project.workOrderPDF?.data && !project.socialAuditReport?.data && (
                  <p className={textMutedClass}>No documents uploaded yet</p>
                )}
              </div>
            </div>

            {/* Location Map */}
            {project.location?.latitude && project.location?.longitude && (
              <div className={`${bgClass} rounded-lg shadow-lg p-6`}>
                <h2 className="text-xl font-bold mb-4">Project Location</h2>
                <DevelopmentMap projects={[project]} selectedId={project._id} className="mb-4" />
                <div className={`${textMutedClass} text-sm`}>
                  <p><span className="font-semibold">GPS Coordinates:</span> {project.location.latitude}, {project.location.longitude}</p>
                  <p className="mt-2"><span className="font-semibold">Address:</span> {project.location.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Key Info Card */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6 mb-6 sticky top-4`}>
              <h3 className="text-lg font-bold mb-4">Project Information</h3>
              <div className="space-y-4">
                <div>
                  <p className={`text-xs font-semibold uppercase ${textMutedClass}`}>Financial Year</p>
                  <p className="font-semibold mt-1">{project.financialYear}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${textMutedClass}`}>Implementing Agency</p>
                  <p className="font-semibold mt-1">{project.implementingAgency}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${textMutedClass}`}>Physical Progress</p>
                  <div className="mt-2">
                    <p className="font-bold text-2xl mb-2">{project.physicalProgress}%</p>
                    <div className="w-full h-3 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all"
                        style={{ width: `${project.physicalProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                {project.beneficiaryCount && (
                  <div>
                    <p className={`text-xs font-semibold uppercase ${textMutedClass}`}>Beneficiaries</p>
                    <p className="font-semibold mt-1">{project.beneficiaryCount}</p>
                  </div>
                )}
                <div>
                  <p className={`text-xs font-semibold uppercase ${textMutedClass}`}>Location</p>
                  <p className="font-semibold mt-1">{project.location.address}</p>
                  {project.location.latitude && project.location.longitude && (
                    <p className="text-xs text-green-600 mt-2">📍 GPS: {project.location.latitude}, {project.location.longitude}</p>
                  )}
                </div>
                <div className={`border-t ${borderClass} pt-4`}>
                  <p className={`text-xs font-semibold uppercase ${textMutedClass}`}>Last Updated</p>
                  <p className="font-semibold mt-1">{formatDate(project.lastUpdatedOn)}</p>
                </div>
              </div>
            </div>

            {/* RTI Transparency Badge */}
            <div className={`${bgClass} rounded-lg shadow-lg p-6 border-2 border-green-600`}>
              <p className="text-sm text-center font-semibold text-green-600">
                ✓ RTI Compliant<br />
                <span className={`text-xs ${textMutedClass}`}>Right to Information Act</span>
              </p>
              <p className={`text-xs ${textMutedClass} mt-3 text-center`}>
                All information on this project is public and available for transparency under RTI Act 2005.
              </p>
            </div>
            {qrCode && (
              <div className={`${bgClass} mt-6 rounded-lg p-6 text-center shadow-lg`}>
                <h3 className="mb-3 text-lg font-bold">Share this project</h3>
                <Image src={qrCode} alt="QR code linking to this project" width={180} height={180} unoptimized className="mx-auto" />
                <a href={qrCode} download={`project-${project._id}-qr.png`} className="mt-3 inline-block font-semibold text-green-700 hover:underline dark:text-green-300">Download QR code</a>
              </div>
            )}
          </div>
        </div>

        <section className={`${bgClass} mt-8 rounded-lg p-6 shadow-lg`}>
          <h2 className="mb-2 text-xl font-bold">Report a concern about this project</h2>
          <p className={`mb-4 text-sm ${textMutedClass}`}>Reports are reviewed by the Panchayat before they appear publicly. Your identity is not shown with approved reports.</p>
          {sessionStatus === "authenticated" ? (
            <form onSubmit={submitReport} className="space-y-4">
              <label className="block font-semibold">
                Concern type
                <select value={reportCategory} onChange={(event) => setReportCategory(event.target.value)} className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"}`}>
                  {["Stalled work", "Quality concern", "Safety concern", "Incorrect project information", "Other"].map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="block font-semibold">
                Details
                <textarea value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} minLength={10} maxLength={1000} rows={4} required className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"}`} placeholder="Describe the concern (10–1,000 characters)" />
              </label>
              <button type="submit" disabled={submittingReport} className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white disabled:opacity-50">{submittingReport ? "Submitting..." : "Submit for review"}</button>
              {reportMessage && <p role="status" className="text-sm">{reportMessage}</p>}
            </form>
          ) : (
            <button onClick={() => signIn(undefined, { callbackUrl: window.location.href })} className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white">
              Sign in to report a concern
            </button>
          )}
          {approvedReports.length > 0 && (
            <div className={`mt-6 border-t ${borderClass} pt-5`}>
              <h3 className="mb-3 font-bold">Reviewed resident reports</h3>
              <ul className="space-y-3">
                {approvedReports.map((report) => (
                  <li key={report._id} className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                    <p className="font-semibold">{report.category} · {formatDate(report.createdAt)}</p>
                    <p className={textMutedClass}>{report.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
