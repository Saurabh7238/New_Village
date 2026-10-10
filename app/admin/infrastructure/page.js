"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast, ToastContainer } from "@/components/Toast";
import { INFRA_TYPES, INFRA_STATUSES } from "@/lib/infrastructureDisplay";

const DETAIL_FIELDS = {
  "Primary School": ["students", "classrooms", "teachers", "washrooms", "handpumps"],
  "Primary Health Center": ["doctors", "beds", "ambulances", "openingHours", "medicines"],
  Road: ["length", "width", "material", "condition"],
  "Street Light": ["totalLights", "workingLights", "faultyLights"],
  "Water Pump": ["capacity", "connectedHouseholds", "condition"],
};

export default function AdminInfrastructurePage() {
  const { data: session, status } = useSession();
  const [infrastructureList, setInfrastructureList] = useState([]);
  const [infraForm, setInfraForm] = useState({
    title: '', description: '', type: INFRA_TYPES[0], status: INFRA_STATUSES[0],
    location: { latitude: '', longitude: '', address: '', ward: '', village: '', landmark: '' },
    cost: '', installationDate: '', expectedCompletionDate: '', lastMaintenanceDate: '', nextMaintenanceDate: '',
    completionPercentage: 0, fundingScheme: '', approvedBudget: '', amountSpent: '', implementingAgency: '',
    image: '', beforeImage: '', afterImage: '', details: {}
  });
  const [editingInfraId, setEditingInfraId] = useState(null);
  const [infraTypeFilter, setInfraTypeFilter] = useState("all");
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetch("/api/infrastructure")
      .then((res) => res.json())
      .then((data) => setInfrastructureList(Array.isArray(data) ? data : []))
      .catch((err) => { console.error("Error:", err); setInfrastructureList([]); });
  }, []);

  const resetInfraForm = () => {
    setEditingInfraId(null);
    setInfraForm({ title: '', description: '', type: infraTypeFilter !== "all" ? infraTypeFilter : INFRA_TYPES[0], status: INFRA_STATUSES[0], location: { latitude: '', longitude: '', address: '', ward: '', village: '', landmark: '' }, cost: '', installationDate: '', expectedCompletionDate: '', lastMaintenanceDate: '', nextMaintenanceDate: '', completionPercentage: 0, fundingScheme: '', approvedBudget: '', amountSpent: '', implementingAgency: '', image: '', beforeImage: '', afterImage: '', details: {} });
  };

  const handleInfraInputChange = (e) => {
    const { name, value } = e.target;
    setInfraForm(prev => ({ ...prev, [name]: value }));
  };

  const handleInfraLocationChange = (e) => {
    const { name, value } = e.target;
    setInfraForm(prev => ({ ...prev, location: { ...prev.location, [name]: value } }));
  };

  const handleImageChange = (name, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      addToast('Choose an image smaller than 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setInfraForm((prev) => ({ ...prev, [name]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setInfraForm((prev) => ({ ...prev, details: { ...prev.details, [name]: value } }));
  };

  const submitInfrastructure = async (e) => {
    e.preventDefault();
    if (!infraForm.title.trim() || !infraForm.type || !infraForm.status) {
      addToast("Title, type, and status are required.", "error");
      return;
    }

    const payload = {
      title: infraForm.title.trim(), description: infraForm.description.trim(), type: infraForm.type, status: infraForm.status,
      location: { ...infraForm.location, ...(infraForm.location.latitude && { latitude: parseFloat(infraForm.location.latitude) }), ...(infraForm.location.longitude && { longitude: parseFloat(infraForm.location.longitude) }) },
      ...(infraForm.image && { image: infraForm.image }), ...(infraForm.beforeImage && { beforeImage: infraForm.beforeImage }), ...(infraForm.afterImage && { afterImage: infraForm.afterImage }),
      ...(infraForm.cost !== '' && { cost: parseFloat(infraForm.cost) }), ...(infraForm.approvedBudget !== '' && { approvedBudget: parseFloat(infraForm.approvedBudget) }), ...(infraForm.amountSpent !== '' && { amountSpent: parseFloat(infraForm.amountSpent) }),
      ...(infraForm.installationDate && { installationDate: new Date(infraForm.installationDate) }), ...(infraForm.expectedCompletionDate && { expectedCompletionDate: new Date(infraForm.expectedCompletionDate) }),
      ...(infraForm.lastMaintenanceDate && { lastMaintenanceDate: new Date(infraForm.lastMaintenanceDate) }), ...(infraForm.nextMaintenanceDate && { nextMaintenanceDate: new Date(infraForm.nextMaintenanceDate) }),
      completionPercentage: Number(infraForm.completionPercentage) || 0, fundingScheme: infraForm.fundingScheme, implementingAgency: infraForm.implementingAgency, details: infraForm.details,
    };
    if (editingInfraId) payload.id = editingInfraId;

    try {
      const res = await fetch("/api/infrastructure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (res.ok) {
        setInfrastructureList((prev) => editingInfraId ? prev.map((item) => (String(item._id) === String(result._id) ? result : item)) : [result, ...prev]);
        resetInfraForm();
        addToast(editingInfraId ? "Infrastructure updated successfully." : "Infrastructure added successfully.", "success");
      } else {
        addToast(result.message || "Unable to save infrastructure.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      addToast("Unable to save infrastructure.", "error");
    }
  };

  const deleteInfrastructure = async (id) => {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await fetch("/api/infrastructure", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) {
        setInfrastructureList((prev) => prev.filter((item) => item._id !== id));
        if (editingInfraId === id) resetInfraForm();
        addToast("Infrastructure deleted successfully.", "success");
      } else {
        addToast("Unable to delete infrastructure.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      addToast("Unable to delete infrastructure.", "error");
    }
  };

  const filteredInfrastructure = infraTypeFilter === "all" ? infrastructureList : infrastructureList.filter((item) => item.type === infraTypeFilter);
  const maintenanceToday = new Date();
  const overdueMaintenance = infrastructureList.filter((item) => item.nextMaintenanceDate && new Date(item.nextMaintenanceDate) < maintenanceToday).length;
  const statusSummary = INFRA_STATUSES.map((infraStatus) => ({
    label: infraStatus,
    count: infrastructureList.filter((item) => item.status === infraStatus).length,
  }));

  const exportInfrastructure = () => {
    const headers = ['Title', 'Type', 'Status', 'Address', 'Village', 'Cost', 'Approved Budget', 'Amount Spent', 'Progress'];
    const rows = filteredInfrastructure.map((item) => [item.title, item.type, item.status, item.location?.address, item.location?.village, item.cost, item.approvedBudget, item.amountSpent, item.completionPercentage]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `infrastructure-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-700 dark:text-yellow-400">Manage Infrastructure</h1>
          <button onClick={() => signOut({ callbackUrl: "/?logout=true" })} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sign Out</button>
        </div>

        <ToastContainer toasts={toasts} removeToast={removeToast} isDark={true} />

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p className="text-sm text-gray-500">Total records</p><p className="text-2xl font-bold">{infrastructureList.length}</p></div>
          <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p className="text-sm text-gray-500">Operational</p><p className="text-2xl font-bold text-green-600">{statusSummary.find((item) => item.label === 'Operational')?.count || 0}</p></div>
          <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p className="text-sm text-gray-500">Work planned/maintenance</p><p className="text-2xl font-bold text-orange-600">{(statusSummary.find((item) => item.label === 'Planned')?.count || 0) + (statusSummary.find((item) => item.label === 'Under Maintenance')?.count || 0)}</p></div>
          <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p className="text-sm text-gray-500">Maintenance overdue</p><p className="text-2xl font-bold text-red-600">{overdueMaintenance}</p></div>
        </section>

        <form onSubmit={submitInfrastructure} className="mb-8 space-y-4 p-6 border rounded-lg bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-orange-700 dark:text-yellow-400">{editingInfraId ? "Update" : "Add"} Infrastructure</h3>
          <input name="title" type="text" placeholder="Title" value={infraForm.title} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          <select name="type" value={infraForm.type} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
            {INFRA_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <textarea name="description" placeholder="Description" value={infraForm.description} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <div className="grid md:grid-cols-3 gap-4">
            <input name="cost" type="number" min="0" placeholder="Total cost (₹)" value={infraForm.cost} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input name="approvedBudget" type="number" min="0" placeholder="Approved budget (₹)" value={infraForm.approvedBudget} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input name="amountSpent" type="number" min="0" placeholder="Amount spent (₹)" value={infraForm.amountSpent} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {['installationDate', 'expectedCompletionDate', 'nextMaintenanceDate'].map((name) => <input key={name} name={name} type="date" value={infraForm[name] || ''} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />)}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <input name="latitude" type="text" placeholder="Latitude" value={infraForm.location.latitude} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input name="longitude" type="text" placeholder="Longitude" value={infraForm.location.longitude} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <select name="status" value={infraForm.status} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
              {INFRA_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <input name="address" type="text" placeholder="Address" value={infraForm.location.address} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input name="ward" type="text" placeholder="Ward" value={infraForm.location.ward} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input name="village" type="text" placeholder="Village" value={infraForm.location.village} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <input name="landmark" type="text" placeholder="Landmark" value={infraForm.location.landmark} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <div className="grid md:grid-cols-3 gap-4">
            <input name="fundingScheme" type="text" placeholder="Funding scheme" value={infraForm.fundingScheme} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input name="implementingAgency" type="text" placeholder="Implementing agency" value={infraForm.implementingAgency} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <label className="border p-2 rounded">Progress: {infraForm.completionPercentage}%<input name="completionPercentage" type="range" min="0" max="100" value={infraForm.completionPercentage} onChange={handleInfraInputChange} className="w-full" /></label>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {['image', 'beforeImage', 'afterImage'].map((name) => <label key={name} className="text-sm">{name === 'image' ? 'Main image' : name === 'beforeImage' ? 'Before photo' : 'After photo'}<input type="file" accept="image/*" onChange={(event) => handleImageChange(name, event)} className="mt-1 border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></label>)}
          </div>
          {DETAIL_FIELDS[infraForm.type]?.length > 0 && <div className="grid md:grid-cols-3 gap-4">{DETAIL_FIELDS[infraForm.type].map((name) => <input key={name} name={name} type="text" placeholder={name.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())} value={infraForm.details?.[name] || ''} onChange={handleDetailChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />)}</div>}
          <div className="flex gap-4">
            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">{editingInfraId ? "Update" : "Add"}</button>
            {editingInfraId && (<button type="button" onClick={resetInfraForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>)}
          </div>
        </form>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">{infraTypeFilter === "all" ? "All Infrastructure" : infraTypeFilter} ({filteredInfrastructure.length})</h2>
          <div className="flex gap-2">
            <select value={infraTypeFilter} onChange={(event) => setInfraTypeFilter(event.target.value)} className="rounded border p-2 text-sm dark:bg-gray-700">
              <option value="all">All types</option>
              {INFRA_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <button type="button" onClick={exportInfrastructure} className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800">Export CSV</button>
          </div>
        </div>
        <div className="space-y-3">
          {filteredInfrastructure.map((item) => (
            <div key={item._id} className="border rounded-lg p-4 flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700">
              <div>
                <h4 className="font-bold">{item.title} ({item.type})</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Status: {item.status}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.location?.address || 'N/A'}</p>
                {item.nextMaintenanceDate && <p className="text-xs text-orange-600 dark:text-orange-300">Next maintenance: {new Date(item.nextMaintenanceDate).toLocaleDateString()}</p>}
              </div>
              <div className="flex space-x-3 shrink-0">
                <button onClick={() => { setEditingInfraId(item._id); setInfraForm(item); }} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                <button onClick={() => deleteInfrastructure(item._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
