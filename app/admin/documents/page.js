"use client";

import Link from 'next/link';
import { useState } from 'react';

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminDocumentsPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [documentType, setDocumentType] = useState('Official document');
  const [message, setMessage] = useState('');

  const findUsers = async (event) => {
    event?.preventDefault();
    const response = await fetch(`/api/admin/citizen-documents?search=${encodeURIComponent(search)}`);
    const data = response.ok ? await response.json() : {};
    setUsers(data.users || []);
    setSelectedUser(null);
  };

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!selectedUser || !files.length || files.length > 5 || files.some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage('Select a citizen and up to five PDF, JPG, or PNG files under 5 MB each.');
      return;
    }
    const response = await fetch('/api/admin/citizen-documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: selectedUser.id, documentType, documents: await Promise.all(files.map(readFile)) }) });
    const data = await response.json();
    setMessage(data.message || 'Unable to save documents.');
    if (response.ok) findUsers();
  };

  return <main className="mx-auto max-w-6xl px-4 py-8"><Link href="/admin" className="text-sm font-semibold text-green-700 hover:underline">Back to Admin</Link><h1 className="mt-4 text-3xl font-bold">Citizen Document Vault</h1><p className="mt-1 text-sm text-gray-600">Search by unique ID, name, father name, mobile, or Aadhaar last four digits.</p><form onSubmit={findUsers} className="mt-5 flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search citizen identity" className="flex-1 rounded border p-3" /><button className="rounded bg-green-700 px-4 py-2 font-semibold text-white">Search</button></form>{message && <p className="mt-3 text-sm text-amber-700">{message}</p>}<div className="mt-6 grid gap-4 lg:grid-cols-2">{users.map((user) => <article key={user.id} className={`rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800 ${selectedUser?.id === user.id ? 'border-green-600' : ''}`}><button type="button" onClick={() => setSelectedUser(user)} className="w-full text-left"><p className="font-bold">{user.name} {user.fatherName ? `| Father: ${user.fatherName}` : ''}</p><p className="text-sm text-gray-600">ID: {user.uniqueId} | Mobile: {user.phone} | Aadhaar: {user.aadhaarLast4 || 'N/A'}</p><p className="text-sm text-gray-600">Documents: {user.documents.length}</p></button>{selectedUser?.id === user.id && <div className="mt-3 border-t pt-3"><input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Document type, e.g. Birth certificate / Address proof" className="mb-2 w-full rounded border p-2" /><input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={upload} className="w-full rounded border p-2" /><ul className="mt-3 list-disc pl-5 text-sm">{user.documents.map((document) => <li key={document.id}><a href={document.viewUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">{document.documentType}: {document.fileName}</a></li>)}</ul></div>}</article>)}</div></main>;
}
