"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MyDocumentsPage() {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    Promise.all([fetch('/api/me'), fetch('/api/my-documents')])
      .then(async ([userResponse, documentResponse]) => {
        const userData = userResponse.ok ? await userResponse.json() : {};
        const documentData = documentResponse.ok ? await documentResponse.json() : {};
        setUser(userData.user || null);
        setDocuments(documentData.documents || []);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/dashboard" className="text-sm font-semibold text-green-700 hover:underline">Back to Dashboard</Link>
      <section className="mt-4 rounded-xl border border-green-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-semibold text-green-700">Citizen Document Vault</p>
        <h1 className="mt-1 text-2xl font-bold">My Documents</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Unique ID: {user?.uniqueId || 'Loading...'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Name: {user?.name || '-'} | Mobile: {user?.phone || '-'} | Aadhaar: {user?.aadhaarLast4 ? `XXXX-XXXX-${user.aadhaarLast4}` : 'Not available'}</p>
      </section>
      <section className="mt-6 space-y-3">
        {documents.length ? documents.map((document) => (
          <article key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div><p className="font-semibold">{document.documentType}</p><p className="text-sm text-gray-500">{document.fileName} | {document.uploadedBy === 'admin' ? 'Panchayat office' : 'Uploaded by you'}</p></div>
            <a href={document.viewUrl} target="_blank" rel="noreferrer" className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800">View / Download</a>
          </article>
        )) : <p className="rounded border border-dashed p-5 text-sm text-gray-600">No documents are stored in your vault yet.</p>}
      </section>
    </main>
  );
}
