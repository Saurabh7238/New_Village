"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ToastContainer, useToast } from '@/components/Toast';

export default function MyDocumentsPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('Personal document');
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    Promise.all([fetch('/api/me'), fetch(`/api/my-documents?page=${page}&limit=10` )])
      .then(async ([userResponse, documentResponse]) => {
        const userData = userResponse.ok ? await userResponse.json() : {};
        const documentData = documentResponse.ok ? await documentResponse.json() : {};
        setUser(userData.user || null);
        setDocuments(documentData.documents || []);
        setPagination(documentData.pagination || { pages: 1 });
      })
      .catch(() => {});
  }, [page]);

  const uploadDocuments = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || files.length > 5 || files.some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage('Choose up to five PDF, JPG, or PNG files under 5 MB each.');
      return;
    }
    const encoded = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
    const response = await fetch('/api/my-documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentType, documents: encoded }) });
    const data = await response.json();
    setMessage(data.message || 'Unable to upload documents.');
    if (response.ok) {
      const refreshed = await fetch(`/api/my-documents?page=${page}&limit=10`);
      const refreshedData = refreshed.ok ? await refreshed.json() : {};
      setDocuments(refreshedData.documents || []);
      setPagination(refreshedData.pagination || { pages: 1 });
      event.target.value = '';
    }
  };

  const deleteDocument = async (documentId) => {
    const confirmed = window.confirm('Delete this uploaded document?');
    if (!confirmed) return;

    setDeletingId(documentId);
    setMessage('');

    try {
      const response = await fetch(`/api/my-documents/${documentId}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete document.');
      }

      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setMessage(data.message || 'Document deleted successfully.');
      addToast(data.message || 'Document deleted successfully.', 'success');
    } catch (error) {
      setMessage(error.message || 'Unable to delete document.');
      addToast(error.message || 'Unable to delete document.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} isDark={false} />
      <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/dashboard" className="text-sm font-semibold text-green-700 hover:underline">Back to Dashboard</Link>
      <section className="mt-4 rounded-xl border border-green-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-semibold text-green-700">Citizen Document Vault</p>
        <h1 className="mt-1 text-2xl font-bold">My Documents</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Unique ID: {user?.uniqueId || 'Loading...'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Name: {user?.name || '-'} | Mobile: {user?.phone || '-'} | Aadhaar: {user?.aadhaarLast4 ? `XXXX-XXXX-${user.aadhaarLast4}` : 'Not available'}</p>
      </section>
      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
        <h2 className="text-lg font-bold">Upload Your Document</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Only you can upload and view documents in this section. The Panchayat manages official documents separately.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Document type, e.g. Address proof" className="rounded border p-2" />
          <input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={uploadDocuments} className="rounded border bg-white p-2" />
        </div>
        {message && <p role="status" className="mt-2 text-sm text-amber-800">{message}</p>}
      </section>
      <section className="mt-6 space-y-3">
        {documents.length ? documents.map((document) => (
          <article key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div><p className="font-semibold">{document.documentType}</p><p className="text-sm text-gray-500">{document.fileName} | {document.uploadedBy === 'admin' ? 'Panchayat office' : 'Uploaded by you'}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setPreviewDocument(document)} className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">View</button>
              <a href={document.viewUrl} download={document.fileName || 'document'} className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800">Download</a>
              {document.uploadedBy === 'citizen' && (
                <button
                  type="button"
                  onClick={() => deleteDocument(document.id)}
                  disabled={deletingId === document.id}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId === document.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </article>
        )) : <p className="rounded border border-dashed p-5 text-sm text-gray-600">No documents are stored in your vault yet.</p>}
      </section>
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border bg-white p-3 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded border px-3 py-1 disabled:opacity-50">Previous</button>
          <span>Page {page} of {pagination.pages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} disabled={page >= pagination.pages} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
        </div>
      )}
      {previewDocument && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${previewDocument.fileName}`}>
          <div className="max-h-[90vh] w-full max-w-4xl rounded-lg bg-white p-4 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">{previewDocument.fileName}</h2><button type="button" onClick={() => setPreviewDocument(null)} className="rounded border px-3 py-1 text-sm">Close</button></div>
            {previewDocument.mimeType === 'application/pdf' ? <iframe title={previewDocument.fileName} src={previewDocument.viewUrl} className="h-[70vh] w-full" /> : <Image src={previewDocument.viewUrl} alt={previewDocument.fileName} width={1200} height={800} unoptimized className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />}
          </div>
        </div>
      )}
      </main>
    </>
  );
}
