"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { DEVELOPMENT_SCHEMES, DEVELOPMENT_STATUSES, getStatusBgClass, formatDate, formatCurrency } from "@/lib/developmentDisplay";
import { useTheme } from "@/app/theme-provider";

export default function DevelopmentAdmin() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    workCode: "",
    workType: "Community Works",
    activityType: "New/Fresh",
    component: "Development",
    scheme: "MNREGA",
    financialYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    sanctionedAmount: "",
    expectedAmount: "",
    amountSpent: "",
    wardNo: "",
    location: { address: "", latitude: "", longitude: "" },
    status: "Sanctioned",
    physicalProgress: 0,
    startDate: "",
    expectedCompletion: "",
    actualCompletion: "",
    registeredOn: "",
    sanctionedDate: "",
    implementingAgency: "",
    focusedArea: "",
    assetType: "",
    assetCategory: "",
    assetSubCategory: "",
    totalUnits: "",
    unitCost: "",
    beneficiaryCount: "",
    beforePhoto: null,
    afterPhoto: null,
    workOrderPDF: null,
    socialAuditReport: null,
    displayOrder: 999,
    id: null,
  });
  const [beforePhotoPreview, setBeforePhotoPreview] = useState(null);
  const [afterPhotoPreview, setAfterPhotoPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScheme, setFilterScheme] = useState("");
  const [filterWard, setFilterWard] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/development");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handlePhotoUpload = (e, photoType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setFormData({ ...formData, [photoType]: base64 });
        if (photoType === "beforePhoto") setBeforePhotoPreview(base64);
        if (photoType === "afterPhoto") setAfterPhotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePDFUpload = (e, pdfType) => {
    const file = e.target.files[0];
    if (file && file.size <= 15 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (pdfType === "workOrderPDF") {
          setFormData({
            ...formData,
            workOrderPDF: { data: base64, name: file.name, mimeType: file.type },
          });
        } else if (pdfType === "socialAuditReport") {
          setFormData({
            ...formData,
            socialAuditReport: { data: base64, name: file.name, mimeType: file.type },
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      setMessage("PDF file size must be less than 15MB");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        location: { ...formData.location, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...formData,
        sanctionedAmount: parseFloat(formData.sanctionedAmount),
        expectedAmount: parseFloat(formData.expectedAmount) || parseFloat(formData.sanctionedAmount),
        amountSpent: parseFloat(formData.amountSpent) || 0,
        wardNo: parseInt(formData.wardNo),
        physicalProgress: parseInt(formData.physicalProgress),
        displayOrder: parseInt(formData.displayOrder),
      };

      const res = await fetch("/api/development", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage(formData.id ? "Project updated successfully" : "Project created successfully");
        resetForm();
        fetchProjects();
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await res.json();
        setMessage(error.message || "Failed to save project");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error saving project");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      ...project,
      id: project._id,
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      expectedCompletion: project.expectedCompletion ? project.expectedCompletion.split("T")[0] : "",
      actualCompletion: project.actualCompletion ? project.actualCompletion.split("T")[0] : "",
      registeredOn: project.registeredOn ? project.registeredOn.split("T")[0] : "",
      sanctionedDate: project.sanctionedDate ? project.sanctionedDate.split("T")[0] : "",
    });
    setBeforePhotoPreview(project.beforePhoto);
    setAfterPhotoPreview(project.afterPhoto);
    window.requestAnimationFrame(() => {
      document.getElementById("development-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const res = await fetch("/api/development", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (res.ok) {
          setMessage("Project deleted successfully");
          fetchProjects();
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage("Failed to delete project");
        }
      } catch (error) {
        console.error("Error:", error);
        setMessage("Error deleting project");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      workCode: "",
      workType: "Community Works",
      activityType: "New/Fresh",
      component: "Development",
      scheme: "MNREGA",
      financialYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      sanctionedAmount: "",
      expectedAmount: "",
      amountSpent: "",
      wardNo: "",
      location: { address: "", latitude: "", longitude: "" },
      status: "Sanctioned",
      physicalProgress: 0,
      startDate: "",
      expectedCompletion: "",
      actualCompletion: "",
      registeredOn: "",
      sanctionedDate: "",
      implementingAgency: "",
      focusedArea: "",
      assetType: "",
      assetCategory: "",
      assetSubCategory: "",
      totalUnits: "",
      unitCost: "",
      beneficiaryCount: "",
      beforePhoto: null,
      afterPhoto: null,
      workOrderPDF: null,
      socialAuditReport: null,
      displayOrder: 999,
      id: null,
    });
    setBeforePhotoPreview(null);
    setAfterPhotoPreview(null);
  };

  const filteredProjects = projects.filter((project) =>
    (!filterYear || project.financialYear === filterYear) &&
    (!filterScheme || project.scheme === filterScheme) &&
    (!filterWard || String(project.wardNo) === filterWard) &&
    (!filterStatus || project.status === filterStatus) &&
    (project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.scheme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.focusedArea?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.implementingAgency?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const availableYears = [...new Set(projects.map((project) => project.financialYear).filter(Boolean))].sort().reverse();

  const stats = {
    totalProjects: projects.length,
    totalSanctioned: projects.reduce((sum, p) => sum + (p.sanctionedAmount || 0), 0),
    totalSpent: projects.reduce((sum, p) => sum + (p.amountSpent || 0), 0),
    completed: projects.filter(p => p.status === 'Completed').length,
    ongoing: projects.filter(p => p.status === 'Ongoing').length,
    sanctioned: projects.filter(p => p.status === 'Sanctioned').length,
    onHold: projects.filter(p => p.status === 'On Hold').length,
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.physicalProgress || 0), 0) / projects.length) : 0,
    withPhotos: projects.filter(p => p.beforePhoto || p.afterPhoto).length,
    withDocuments: projects.filter(p => p.workOrderPDF?.data || p.socialAuditReport?.data).length,
  };

  const handleGenerateReport = () => {
    const reportContent = `
GRAM PANCHAYAT DEVELOPMENT PROJECTS REPORT
Generated on: ${new Date().toLocaleDateString('en-IN')}

=== SUMMARY STATISTICS ===
Total Projects: ${stats.totalProjects}
Total Sanctioned Amount: ${formatCurrency(stats.totalSanctioned)}
Total Amount Spent: ${formatCurrency(stats.totalSpent)}
Average Progress: ${stats.avgProgress}%

Status Breakdown:
  Completed: ${stats.completed}
  Ongoing: ${stats.ongoing}
  Sanctioned: ${stats.sanctioned}
  On Hold: ${stats.onHold}

Projects with Photos: ${stats.withPhotos}
Projects with Documents: ${stats.withDocuments}

=== DETAILED PROJECT LIST ===
${projects
  .map(
    (p, i) => `
${i + 1}. ${p.title}
   Scheme: ${p.scheme}
   Ward: ${p.wardNo}
   Status: ${p.status}
   Progress: ${p.physicalProgress}%
   Sanctioned: ${formatCurrency(p.sanctionedAmount)}
   Spent: ${formatCurrency(p.amountSpent)}
   Agency: ${p.implementingAgency}
   Timeline: ${formatDate(p.startDate)} to ${formatDate(p.expectedCompletion)}
   Beneficiaries: ${p.beneficiaryCount || 'N/A'}
   Location: ${p.location.address}
`
  )
  .join('\n')}

=== FOR GRAM SABHA DISPLAY ===
Print this report and display in Gram Sabha meetings for transparency and social audit.
`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `gram-panchayat-development-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const bgClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const inputClass = isDark
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-gray-900 border-gray-300";
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${textClass}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-green-700 dark:text-yellow-400">Development Projects Management</h1>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          >
            <div
              className={`flex w-full max-w-md items-center justify-between gap-4 rounded-xl border px-5 py-4 text-center shadow-2xl ${
                message.includes("Error") || message.includes("Failed")
                  ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                  : "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              }`}
            >
              <span className="flex-1 font-semibold">{message}</span>
              <button
                type="button"
                onClick={() => setMessage("")}
                aria-label="Close message"
                className="rounded-md px-2 py-1 text-lg leading-none opacity-70 hover:bg-black/10 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8`}>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg`}>
            <p className={`text-sm font-semibold ${labelClass} uppercase`}>Total Projects</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalProjects}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg`}>
            <p className={`text-sm font-semibold ${labelClass} uppercase`}>Sanctioned</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats.totalSanctioned)}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg`}>
            <p className={`text-sm font-semibold ${labelClass} uppercase`}>Spent</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(stats.totalSpent)}</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg`}>
            <p className={`text-sm font-semibold ${labelClass} uppercase`}>Avg Progress</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.avgProgress}%</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg`}>
            <p className={`text-sm font-semibold ${labelClass} uppercase`}>Completed</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.completed}</p>
          </div>
        </div>

        {/* Status Breakdown Cards */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8`}>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg text-center border-2 border-emerald-500`}>
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className={`text-sm font-semibold ${labelClass}`}>Completed</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg text-center border-2 border-green-500`}>
            <p className="text-2xl font-bold text-green-600">{stats.ongoing}</p>
            <p className={`text-sm font-semibold ${labelClass}`}>Ongoing</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg text-center border-2 border-blue-500`}>
            <p className="text-2xl font-bold text-blue-600">{stats.sanctioned}</p>
            <p className={`text-sm font-semibold ${labelClass}`}>Sanctioned</p>
          </div>
          <div className={`${bgClass} p-4 rounded-lg shadow-lg text-center border-2 border-amber-500`}>
            <p className="text-2xl font-bold text-amber-600">{stats.onHold}</p>
            <p className={`text-sm font-semibold ${labelClass}`}>On Hold</p>
          </div>
        </div>

        {/* Report Generation */}
        <div className={`${bgClass} p-4 rounded-lg shadow-lg mb-8 flex justify-between items-center`}>
          <div>
            <p className="font-semibold">Gram Sabha Reports</p>
            <p className={`text-sm ${labelClass}`}>
              Documentation with Photos: {stats.withPhotos}/{stats.totalProjects} |
              Documents Uploaded: {stats.withDocuments}/{stats.totalProjects}
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
          >
            📄 Generate Report
          </button>
        </div>

        <div id="development-editor" className={`${bgClass} scroll-mt-24 p-8 rounded-lg shadow-lg mb-8`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-wide ${labelClass}`}>{formData.id ? "Editing saved record" : "New record"}</p>
              <h2 className="text-2xl font-bold">{formData.id ? "Edit Development Project" : "Add Development Project"}</h2>
            </div>
            {formData.id && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-400 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Work Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Road Construction in Ward 5"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Work Code</label>
                <input
                  type="text"
                  name="workCode"
                  value={formData.workCode}
                  onChange={handleInputChange}
                  placeholder="e.g., 54331427"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Work Type</label>
                <input
                  type="text"
                  name="workType"
                  value={formData.workType}
                  onChange={handleInputChange}
                  placeholder="Community Works"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Activity Type</label>
                <select
                  name="activityType"
                  value={formData.activityType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                >
                  <option value="New/Fresh">New/Fresh</option>
                  <option value="Repair">Repair</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Expansion">Expansion</option>
                </select>
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Component</label>
                <input
                  type="text"
                  name="component"
                  value={formData.component}
                  onChange={handleInputChange}
                  placeholder="Development"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Scheme *</label>
                <select
                  name="scheme"
                  value={formData.scheme}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                >
                  {DEVELOPMENT_SCHEMES.map((scheme) => (
                    <option key={scheme} value={scheme}>
                      {scheme}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Financial Year *</label>
                <input
                  type="text"
                  name="financialYear"
                  value={formData.financialYear}
                  onChange={handleInputChange}
                  placeholder="YYYY-YYYY"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  pattern="\d{4}-\d{4}"
                  required
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Sanctioned Amount (₹) *</label>
                <input
                  type="number"
                  name="sanctionedAmount"
                  value={formData.sanctionedAmount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Expected Amount (₹)</label>
                <input
                  type="number"
                  name="expectedAmount"
                  value={formData.expectedAmount}
                  onChange={handleInputChange}
                  placeholder="Defaults to sanctioned amount"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Amount Spent (₹)</label>
                <input
                  type="number"
                  name="amountSpent"
                  value={formData.amountSpent}
                  onChange={handleInputChange}
                  placeholder="0"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Ward Number *</label>
                <input
                  type="number"
                  name="wardNo"
                  value={formData.wardNo}
                  onChange={handleInputChange}
                  placeholder="Ward number"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required={!formData.id}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                >
                  {DEVELOPMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Physical Progress % *</label>
                <input
                  type="number"
                  name="physicalProgress"
                  value={formData.physicalProgress}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required={!formData.id}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Expected Completion *</label>
                <input
                  type="date"
                  name="expectedCompletion"
                  value={formData.expectedCompletion}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Registered On</label>
                <input
                  type="date"
                  name="registeredOn"
                  value={formData.registeredOn}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Sanctioned Date</label>
                <input
                  type="date"
                  name="sanctionedDate"
                  value={formData.sanctionedDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Actual Completion</label>
                <input
                  type="date"
                  name="actualCompletion"
                  value={formData.actualCompletion}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Implementing Agency *</label>
                <input
                  type="text"
                  name="implementingAgency"
                  value={formData.implementingAgency}
                  onChange={handleInputChange}
                  placeholder="e.g., PWD, NRLM"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <label className={`block ${labelClass} mb-2 font-semibold`}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Project details and scope"
                rows="3"
                className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
              />
            </div>

            <div>
              <label className={`block ${labelClass} mb-2 font-semibold`}>Focused Area</label>
              <input
                type="text"
                name="focusedArea"
                value={formData.focusedArea}
                onChange={handleInputChange}
                placeholder="e.g., Roads, Sanitation, Education"
                className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
              />
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
              <h3 className="text-xl font-bold mb-4">Asset Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Asset Type</label>
                  <input
                    type="text"
                    name="assetType"
                    value={formData.assetType}
                    onChange={handleInputChange}
                    placeholder="Immovable"
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Asset Category</label>
                  <input
                    type="text"
                    name="assetCategory"
                    value={formData.assetCategory}
                    onChange={handleInputChange}
                    placeholder="Not Available"
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Asset Sub Category</label>
                  <input
                    type="text"
                    name="assetSubCategory"
                    value={formData.assetSubCategory}
                    onChange={handleInputChange}
                    placeholder="Street Light"
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Total Units</label>
                  <input
                    type="number"
                    min="0"
                    name="totalUnits"
                    value={formData.totalUnits}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Location Address *</label>
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="Full address"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  required
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Latitude</label>
                <input
                  type="number"
                  name="location.latitude"
                  value={formData.location.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 28.5355"
                  step="0.0001"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Longitude</label>
                <input
                  type="number"
                  name="location.longitude"
                  value={formData.location.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 77.3937"
                  step="0.0001"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block ${labelClass} mb-2 font-semibold`}>Beneficiary Count</label>
                <input
                  type="text"
                  name="beneficiaryCount"
                  value={formData.beneficiaryCount}
                  onChange={handleInputChange}
                  placeholder="e.g., 150 families"
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                />
              </div>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
              <h3 className="text-xl font-bold mb-4">File Uploads</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Before Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, "beforePhoto")}
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                  {beforePhotoPreview && (
                    <div className="mt-3">
                      <Image
                        src={beforePhotoPreview}
                        alt="Before"
                        width={128}
                        height={128}
                        unoptimized
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>After Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, "afterPhoto")}
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                  {afterPhotoPreview && (
                    <div className="mt-3">
                      <Image
                        src={afterPhotoPreview}
                        alt="After"
                        width={128}
                        height={128}
                        unoptimized
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Work Order PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePDFUpload(e, "workOrderPDF")}
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                  {formData.workOrderPDF?.name && (
                    <p className="text-sm mt-2 text-green-600 dark:text-green-400">✓ {formData.workOrderPDF.name}</p>
                  )}
                </div>

                <div>
                  <label className={`block ${labelClass} mb-2 font-semibold`}>Social Audit Report PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePDFUpload(e, "socialAuditReport")}
                    className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                  />
                  {formData.socialAuditReport?.name && (
                    <p className="text-sm mt-2 text-green-600 dark:text-green-400">✓ {formData.socialAuditReport.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? "Saving..." : formData.id ? "Update Project" : "Create Project"}
              </button>
            </div>
          </form>
        </div>

        <div className={`${bgClass} p-8 rounded-lg shadow-lg`}>
          <h2 className="text-2xl font-bold mb-6">Projects List</h2>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <input
              type="text"
              placeholder="Search activity, scheme, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 min-w-[220px] px-4 py-2 border rounded-lg ${inputClass}`}
            />
            <select
              value={filterScheme}
              onChange={(e) => setFilterScheme(e.target.value)}
              className={`px-4 py-2 border rounded-lg ${inputClass}`}
            >
              <option value="">All Schemes</option>
              {DEVELOPMENT_SCHEMES.map((scheme) => (
                <option key={scheme} value={scheme}>
                  {scheme}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className={`px-4 py-2 border rounded-lg ${inputClass}`}
            >
              <option value="">All Plan Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className={`px-4 py-2 border rounded-lg ${inputClass}`}
            >
              <option value="">All Wards</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ward) => (
                <option key={ward} value={ward}>
                  Ward {ward}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 border rounded-lg ${inputClass}`}
            >
              <option value="">All Status</option>
              {DEVELOPMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterScheme("");
                setFilterWard("");
                setFilterStatus("");
                setFilterYear("");
              }}
              className="px-4 py-2 border border-gray-400 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Clear filters
            </button>
            <span className={`text-sm font-semibold ${labelClass}`}>
              {filteredProjects.length} shown of {projects.length} stored
            </span>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className={`w-full border-collapse text-sm ${isDark ? "border-gray-700" : "border-gray-300"}`}>
              <thead>
                <tr className={`border-b-2 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100"}`}>
                  <th className="px-4 py-3 text-left">Activity</th>
                  <th className="px-4 py-3 text-left">Scheme</th>
                  <th className="px-4 py-3 text-left">Registered</th>
                  <th className="px-4 py-3 text-left">Expected</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Focused Area</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr
                      key={project._id}
                      className={`border-b ${isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"}`}
                    >
                      <td className="px-4 py-3">{project.title}</td>
                      <td className="px-4 py-3">{project.scheme}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(project.registeredOn || project.startDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(project.expectedAmount ?? project.sanctionedAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBgClass(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{project.focusedArea || "Not provided"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEdit(project)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(project._id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div key={project._id} className={`rounded-lg border ${isDark ? "border-gray-700 bg-gray-700" : "border-gray-300 bg-gray-50"} p-4 shadow`}>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-green-700 dark:text-green-400">{project.title}</p>
                        <p className="text-gray-600 dark:text-gray-400">{project.scheme}</p>
                      </div>
                    </div>
                    <div className="border-t dark:border-gray-600 pt-2 grid grid-cols-2 gap-2">
                      <div><strong>Registered:</strong> {formatDate(project.registeredOn || project.startDate)}</div>
                      <div><strong>Progress:</strong> {project.physicalProgress}%</div>
                      <div className="col-span-2"><strong>Expected:</strong> {formatCurrency(project.expectedAmount ?? project.sanctionedAmount)}</div>
                      <div className="col-span-2"><strong>Area:</strong> {project.focusedArea || "Not provided"}</div>
                      <div className="col-span-2">
                        <strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBgClass(project.status)}`}>{project.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="flex-1 rounded bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        className="flex-1 rounded bg-red-600 hover:bg-red-700 text-white px-2 py-2 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No projects found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
