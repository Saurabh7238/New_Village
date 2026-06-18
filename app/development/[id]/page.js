"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { formatDate, formatCurrency, calculateDaysRemaining, getStatusBgClass } from "@/lib/developmentDisplay";
import { useTheme } from "@/app/theme-provider";
import DevelopmentMap from "@/components/DevelopmentMap";

export default function DevelopmentDetailPage({ params }) {
  const { isDark } = useTheme();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/development?id=${params.id}`);
      const data = await res.json();
      const foundProject = Array.isArray(data) ? data[0] : data;
      setProject(foundProject);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

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
  ];

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
                  <img src={photos[photoIndex].src} alt={photos[photoIndex].label} className="w-full h-full object-cover" />
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
                </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
