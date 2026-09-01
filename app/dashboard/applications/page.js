"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function MyApplicationsContent() {
  const [applications, setApplications] = useState([]);
  const [updates, setUpdates] = useState({});
  const [documentDrafts, setDocumentDrafts] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const service = searchParams.get('service');
  const highlightedId = searchParams.get('application');
  useEffect(() => { fetch('/api/applications').then((response) => response.ok ? response.json() : { applications: [] }).then((data) => setApplications(data.applications || [])).finally(() => setLoading(false)); }, []);
  
  // Poll for application updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/applications').then((response) => response.ok ? response.json() : { applications: [] }).then((data) => setApplications(data.applications || [])).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { fetch('/api/service-notifications').then((response) => response.ok ? response.json() : null).then((data) => setUpdates(Object.fromEntries((data?.notifications || []).map((note) => [note.relatedId, note])))); }, []);
  
  // Poll for notification updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/service-notifications').then((response) => response.ok ? response.json() : null).then((data) => setUpdates(Object.fromEntries((data?.notifications || []).map((note) => [note.relatedId, note])))).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const openUpdate = async (application) => { const notification = updates[application.id]; if (notification) { await fetch('/api/service-notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: notification.id }) }); setUpdates((current) => { const next = { ...current }; delete next[application.id]; return next; }); } };

  const prepareDocuments = async (applicationId, event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (files.length > 5 || files.some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      window.alert('Choose up to five PDF, JPG, or PNG documents under 5 MB each.');
      event.target.value = '';
      return;
    }

    const documents = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));

    setDocumentDrafts((current) => ({ ...current, [applicationId]: documents }));
  };

  const uploadAdditionalDocuments = async (application) => {
    const documents = documentDrafts[application.id] || [];
    if (!documents.length) return;

    setUploadingId(application.id);
    try {
      const response = await fetch(`/api/applications/${application.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });
      const data = await response.json();
      if (!response.ok) {
        window.alert(data.message || 'Unable to upload documents.');
        return;
      }

      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status: data.application.status, documents: data.application.documents, requestedDocuments: [] } : item));
      setDocumentDrafts((current) => ({ ...current, [application.id]: [] }));
      window.alert(data.message || 'Documents uploaded successfully.');
    } finally {
      setUploadingId(null);
    }
  };

  const visibleApplications = service ? applications.filter((application) => application.serviceType === service) : applications;
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900"><div className="mx-auto max-w-4xl"><h1 className="mb-6 text-3xl font-bold text-green-700 dark:text-yellow-400">My Service Applications</h1>{loading ? <p>Loading applications...</p> : visibleApplications.length === 0 ? <p>No service applications yet.</p> : <div className="space-y-3">{visibleApplications.map((application) => <article key={application.id} className={`rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${highlightedId === application.id ? 'ring-2 ring-red-500' : ''}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-green-700">{application.applicationNumber}</p><p className="capitalize">{application.serviceType.replace(/-/g, ' ')}</p></div><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-100">{application.status}</span></div><p className="mt-2 text-sm text-gray-500">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>{updates[application.id] && <button onClick={() => openUpdate(application)} className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">View new update</button>}{application.requestedDocuments?.length > 0 && <p className="mt-3 border-t pt-3 text-sm text-orange-700 dark:text-orange-300"><strong>Documents requested:</strong> {application.requestedDocuments.join(', ')}</p>}{application.adminRemarks && <p className="mt-3 border-t pt-3 text-sm"><strong>Admin update:</strong> {application.adminRemarks}</p>}{(application.status === 'Need Documents' || application.status === 'Updated' || application.status === 'Rejected') && <div className="mt-3 border-t pt-3"><p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Upload additional documents</p><input type="file" multiple accept=".pdf,image/png,image/jpeg" onChange={(event) => prepareDocuments(application.id, event)} className="mt-2 block w-full rounded border border-dashed px-3 py-2 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" /><div className="mt-2 flex flex-wrap gap-2">{documentDrafts[application.id]?.length > 0 && <button type="button" onClick={() => uploadAdditionalDocuments(application)} disabled={uploadingId === application.id} className="rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{uploadingId === application.id ? 'Uploading...' : `Upload ${documentDrafts[application.id].length} document(s)`}</button>}</div></div>}{application.documents?.length > 0 && <div className="mt-3 border-t pt-3 text-sm"><strong>Your uploaded documents:</strong><ul className="mt-1 space-y-1">{application.documents.map((document, index) => <li key={`${document.fileName}-${index}`}><a href={document.fileUrl} download={document.fileName} className="text-green-700 underline dark:text-green-300">{document.fileName || `Document ${index + 1}`}</a></li>)}</ul></div>}{application.adminDocuments?.length > 0 && <div className="mt-3 border-t pt-3 text-sm"><strong>Panchayat uploaded documents:</strong><ul className="mt-1 space-y-1">{application.adminDocuments.map((document, index) => <li key={`${document.fileName || 'admin'}-${index}`}><a href={document.fileUrl} download={document.fileName} className="text-blue-700 underline dark:text-blue-300">{document.fileName || `Panchayat document ${index + 1}`}</a></li>)}</ul></div>}{(!application.documents?.length && !application.adminDocuments?.length) && <p className="mt-3 border-t pt-3 text-sm text-gray-500">No supporting documents uploaded yet.</p>}</article>)}</div>}</div></main>;
}

export default function MyApplicationsPage() {
  return <Suspense fallback={<div className="p-8 text-center">Loading applications...</div>}><MyApplicationsContent /></Suspense>;
}
