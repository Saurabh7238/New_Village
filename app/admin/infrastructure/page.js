"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast, ToastContainer } from "@/components/Toast";
import { INFRA_TYPES, INFRA_STATUSES } from "@/lib/infrastructureDisplay";

export default function AdminInfrastructurePage() {
  const { data: session, status } = useSession();
  const [infrastructureList, setInfrastructureList] = useState([]);
  const [infraForm, setInfraForm] = useState({
    title: '', description: '', type: INFRA_TYPES[0], status: INFRA_STATUSES[0],
    location: { latitude: '', longitude: '', address: '' }, cost: '', installationDate: '', image: '', details: {}
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
    setInfraForm({ title: '', description: '', type: infraTypeFilter !== "all" ? infraTypeFilter : INFRA_TYPES[0], status: INFRA_STATUSES[0], location: { latitude: '', longitude: '', address: '' }, cost: '', installationDate: '', image: '', details: {} });
  };

  const handleInfraInputChange = (e) => {
    const { name, value } = e.target;
    setInfraForm(prev => ({ ...prev, [name]: value }));
  };

  const handleInfraLocationChange = (e) => {
    const { name, value } = e.target;
    setInfraForm(prev => ({ ...prev, location: { ...prev.location, [name]: value } }));
  };

  const submitInfrastructure = async (e) => {
    e.preventDefault();
    if (!infraForm.title.trim() || !infraForm.type || !infraForm.status) {
      addToast("Title, type, and status are required.", "error");
      return;
    }

    const payload = {
      title: infraForm.title.trim(), description: infraForm.description.trim(), type: infraForm.type, status: infraForm.status,
      location: { ...(infraForm.location.latitude && { latitude: parseFloat(infraForm.location.latitude) }), ...(infraForm.location.longitude && { longitude: parseFloat(infraForm.location.longitude) }), ...(infraForm.location.address && { address: infraForm.location.address.trim() }) },
      ...(infraForm.image && { image: infraForm.image }), ...(infraForm.cost && { cost: parseFloat(infraForm.cost) }), ...(infraForm.installationDate && { installationDate: new Date(infraForm.installationDate) })
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

        <form onSubmit={submitInfrastructure} className="mb-8 space-y-4 p-6 border rounded-lg bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-orange-700 dark:text-yellow-400">{editingInfraId ? "Update" : "Add"} Infrastructure</h3>
          <input name="title" type="text" placeholder="Title" value={infraForm.title} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          <select name="type" value={infraForm.type} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
            {INFRA_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <textarea name="description" placeholder="Description" value={infraForm.description} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <div className="grid md:grid-cols-3 gap-4">
            <input name="latitude" type="text" placeholder="Latitude" value={infraForm.location.latitude} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input name="longitude" type="text" placeholder="Longitude" value={infraForm.location.longitude} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <select name="status" value={infraForm.status} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
              {INFRA_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <input name="address" type="text" placeholder="Address" value={infraForm.location.address} onChange={handleInfraLocationChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <div className="flex gap-4">
            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">{editingInfraId ? "Update" : "Add"}</button>
            {editingInfraId && (<button type="button" onClick={resetInfraForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>)}
          </div>
        </form>

        <h2 className="text-2xl font-bold mb-4">{infraTypeFilter === "all" ? "All Infrastructure" : infraTypeFilter} ({filteredInfrastructure.length})</h2>
        <div className="space-y-3">
          {filteredInfrastructure.map((item) => (
            <div key={item._id} className="border rounded-lg p-4 flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700">
              <div>
                <h4 className="font-bold">{item.title} ({item.type})</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Status: {item.status}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.location?.address || 'N/A'}</p>
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
