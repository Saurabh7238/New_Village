"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DEVELOPMENT_SCHEMES,
  DEVELOPMENT_STATUSES,
  getStatusBgClass,
  getProgressBarClass,
  getProgressColor,
  formatDate,
  formatCurrency,
  groupByScheme,
  groupByWard,
} from "@/lib/developmentDisplay";
import { useTheme } from "@/app/theme-provider";
import DevelopmentMap from "@/components/DevelopmentMap";

export default function DevelopmentPage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [viewType, setViewType] = useState("scheme"); // scheme, ward, or map
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/development");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedData = viewType === "scheme" ? groupByScheme(projects) : groupByWard(projects);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${isDark ? "text-white" : "text-gray-900"} flex items-center justify-center`}>
        <div className="text-xl">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${isDark ? "text-white" : "text-gray-900"}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-green-700 dark:text-yellow-400">Development Projects</h1>
          <p className={`text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Transparency in Infrastructure Development - Real-time tracking of all ongoing and completed projects
          </p>
        </div>

        {/* View Toggle */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setViewType("scheme")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              viewType === "scheme"
                ? "bg-green-600 text-white"
                : `${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100"} border ${isDark ? "border-gray-700" : "border-gray-300"}`
            }`}
          >
            📋 View by Scheme
          </button>
          <button
            onClick={() => setViewType("ward")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              viewType === "ward"
                ? "bg-green-600 text-white"
                : `${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100"} border ${isDark ? "border-gray-700" : "border-gray-300"}`
            }`}
          >
            📍 View by Ward
          </button>
          <button
            onClick={() => setViewType("map")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              viewType === "map"
                ? "bg-green-600 text-white"
                : `${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100"} border ${isDark ? "border-gray-700" : "border-gray-300"}`
            }`}
          >
            🗺️ View on Map
          </button>
        </div>

        {/* Projects Grouped Display */}
        {viewType === "map" ? (
          <div>
            <DevelopmentMap projects={projects} className="mb-8" />
            <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-6`}>
              <h3 className="text-lg font-bold mb-4">Map Legend</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">✓</div>
                  <span>Completed (80%+)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">▶</div>
                  <span>Ongoing (in progress)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">●</div>
                  <span>Sanctioned (approved)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">⏸</div>
                  <span>On Hold (paused)</span>
                </div>
              </div>
            </div>
          </div>
        ) : viewType === "scheme" || viewType === "ward" ? (
          Object.entries(groupedData).map(([groupName, groupProjects]) => (
            <div key={groupName} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-green-700 dark:text-yellow-400">{groupName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupProjects.map((project) => (
                  <Link key={project._id} href={`/development/${project._id}`}>
                    <div
                      className={`${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-xl"} rounded-lg shadow-lg overflow-hidden transition cursor-pointer transform hover:scale-105`}
                    >
                      {/* Image Section */}
                      {project.beforePhoto && (
                        <div className="h-48 bg-gray-300 dark:bg-gray-700 overflow-hidden">
                          <img src={project.beforePhoto} alt={project.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="p-6">
                        {/* Title and Status */}
                        <div className="mb-4">
                          <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBgClass(project.status)}`}>
                            {project.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">Progress</span>
                            <span className="text-sm font-bold">{project.physicalProgress}%</span>
                          </div>
                          <div className={`w-full h-3 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden`}>
                            <div
                              className={`h-full transition-all ${getProgressBarClass(project.physicalProgress)}`}
                              style={{ width: `${project.physicalProgress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Quick Info */}
                        <div className={`grid grid-cols-3 gap-4 py-4 border-t border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                          <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Sanctioned</p>
                            <p className="font-bold text-green-600">{formatCurrency(project.sanctionedAmount)}</p>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Spent</p>
                            <p className="font-bold text-blue-600">{formatCurrency(project.amountSpent)}</p>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Remaining</p>
                            <p className="font-bold text-orange-600">
                              {formatCurrency(project.sanctionedAmount - project.amountSpent)}
                            </p>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="mt-4 space-y-2">
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            <span className="font-semibold">Scheme:</span> {project.scheme}
                          </p>
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            <span className="font-semibold">Agency:</span> {project.implementingAgency}
                          </p>
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            <span className="font-semibold">Timeline:</span> {formatDate(project.startDate)} to{" "}
                            {formatDate(project.expectedCompletion)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            <p className="text-lg">No development projects found</p>
          </div>
        )}
      </div>
    </div>
  );
}