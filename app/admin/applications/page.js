"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const STATUSES = ['Submitted', 'Under Review', 'Need Documents', 'Approved', 'Rejected', 'Completed'];

function AdminApplicationsContent() {
  const { data: session, status: authStatus } = useSession();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const searchParams = useSearchParams();
  const selectedService = searchParams.get('service') || '';

  const loadApplications = async () => {
    setLoading(true);
    const response = await fetch('/api/admin/applications');
    const data = response.ok ? await response.json() : { applications: [] };
    setApplications(data.applications || []);
    setLoading(false);
  };

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'admin') loadApplications();
  }, [authStatus, session?.user?.role]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'admin') fetch('/api/service-notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ relatedType: 'application' }) });
  }, [authStatus, session?.user?.role]);

  const updateLocal = (id, key, value) => setApplications((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const updateDocuments = async (id, event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 5 || files.some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) return alert('Choose up to five PDF, JPG, or PNG documents under 5 MB each.');
    const documents = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
    updateLocal(id, 'adminDocuments', documents);
  };
  const save = async (application) => {
    setSavingId(application.id);
    const response = await fetch('/api/admin/applications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: application.id, status: application.status, adminRemarks: application.adminRemarks, adminDocuments: application.adminDocuments || [] }) });
    setSavingId(null);
    if (response.ok) loadApplications();
  };
  const remove = async (application) => {
    if (!window.confirm(`Delete ${application.applicationNumber}? This cannot be undone.`)) return;
    setSavingId(application.id);
    const response = await fetch('/api/admin/applications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: application.id }) });
    setSavingId(null);
    if (response.ok) setApplications((items) => items.filter((item) => item.id !== application.id));
    else alert('Unable to delete this application.');
  };

  if (authStatus === 'loading') return <div className="p-8 text-center">Loading...</div>;
  if (session?.user?.role !== 'admin') return <div className="p-8 text-center text-red-600">Access denied.</div>;

  const visibleApplications = selectedService ? applications.filter((application) => application.serviceType === selectedService) : applications;
  const serviceTitle = selectedService ? selectedService.replace(/-/g, ' ') : 'Service Applications';
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900"><div className="mx-auto max-w-7xl"><div className="mb-6 flex items-center justify-between gap-4"><div><h1 className="text-3xl font-bold capitalize text-green-700 dark:text-yellow-400">{serviceTitle}</h1><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Review citizen details, documents, status, and response remarks.</p></div><Link href="/admin" className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">Back to Admin</Link></div><div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-3">Application / Citizen</th><th className="p-3">Service</th><th className="p-3">Submitted</th><th className="p-3">Status</th><th className="p-3">Remarks</th><th className="p-3">Panchayat documents</th><th className="p-3">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="p-8 text-center">Loading applications...</td></tr> : visibleApplications.length === 0 ? <tr><td colSpan="7" className="p-8 text-center">No service applications found.</td></tr> : visibleApplications.map((application) => <tr key={application.id} className="border-t align-top dark:border-gray-700"><td className="p-3"><p className="font-semibold text-green-700">{application.applicationNumber}</p><p>{application.userId?.name || application.formData?.applicant?.name || 'Citizen'}</p><p className="text-xs text-gray-500">{application.userId?.phone || application.formData?.applicant?.phone || ''}</p></td><td className="p-3 capitalize">{application.serviceType.replace(/-/g, ' ')}</td><td className="p-3">{new Date(application.createdAt).toLocaleDateString()}</td><td className="p-3"><select value={application.status} onChange={(event) => updateLocal(application.id, 'status', event.target.value)} className="rounded border p-2 dark:bg-gray-700">{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></td><td className="p-3"><textarea rows="3" value={application.adminRemarks || ''} onChange={(event) => updateLocal(application.id, 'adminRemarks', event.target.value)} className="w-full rounded border p-2 dark:bg-gray-700" placeholder="Message for the citizen" /></td><td className="p-3"><input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={(event) => updateDocuments(application.id, event)} className="w-48 text-xs" />{application.adminDocuments?.length > 0 && <p className="mt-1 text-xs text-green-700">{application.adminDocuments.length} document(s) ready</p>}</td><td className="p-3"><div className="flex gap-2"><button disabled={savingId === application.id} onClick={() => save(application)} className="rounded bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-50">{savingId === application.id ? 'Saving...' : 'Save'}</button><button disabled={savingId === application.id} onClick={() => remove(application)} className="rounded bg-red-600 px-3 py-2 font-semibold text-white disabled:opacity-50">Delete</button></div></td></tr>)}</tbody></table></div></div></main>;
}

export default function AdminApplicationsPage() {
  return <Suspense fallback={<div className="p-8 text-center">Loading service applications...</div>}><AdminApplicationsContent /></Suspense>;
}
