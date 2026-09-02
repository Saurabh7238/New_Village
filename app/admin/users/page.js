"use client";

import Link from 'next/link';
import { useState } from 'react';

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '-';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (event) => {
    event?.preventDefault();
    setLoading(true);
    const response = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
    const data = response.ok ? await response.json() : {};
    setUsers(data.users || []);
    setSelected(null);
    setLoading(false);
  };

  const viewUser = async (id) => {
    const response = await fetch(`/api/admin/users/${id}`);
    const data = response.ok ? await response.json() : {};
    setSelected(data.user ? data : null);
  };

  const RecordList = ({ title, records, render }) => (
    <section className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-lg font-bold">{title} ({records?.length || 0})</h3>
      {records?.length ? <div className="space-y-2">{records.map((record, index) => <div key={record.id || record._id || index} className="rounded border p-3 text-sm">{render(record)}</div>)}</div> : <p className="text-sm text-gray-500">No records found.</p>}
    </section>
  );

  return <main className="mx-auto max-w-7xl px-4 py-8"><Link href="/admin" className="text-sm font-semibold text-green-700 hover:underline">Back to Admin</Link><h1 className="mt-4 text-3xl font-bold">Citizen Directory</h1><p className="mt-1 text-sm text-gray-600">View a citizen&apos;s identity, applications, appointments, queries, documents, voter records, and chat records.</p><form onSubmit={searchUsers} className="mt-5 flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, name, father name, mobile, email, or Aadhaar last 4" className="min-w-0 flex-1 rounded border p-3" /><button className="rounded bg-green-700 px-4 py-2 font-semibold text-white">{loading ? 'Searching...' : 'Search'}</button></form><div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr]"><section className="space-y-3">{users.map((user) => <button type="button" key={user.id} onClick={() => viewUser(user.id)} className={`block w-full rounded-lg border bg-white p-4 text-left shadow-sm dark:border-gray-700 dark:bg-gray-800 ${selected?.user?.id === user.id ? 'border-green-600 ring-2 ring-green-200' : ''}`}><p className="font-bold">{user.name}</p><p className="text-sm text-gray-600">Father: {user.fatherName || '-'} | ID: {user.uniqueId}</p><p className="text-sm text-gray-600">Mobile: {user.phone} | Aadhaar: {user.aadhaar}</p><p className="mt-2 text-xs text-gray-500">Apps {user.counts.applications} · Appointments {user.counts.appointments} · Queries {user.counts.queries} · Documents {user.counts.documents}</p></button>)}{!users.length && <p className="rounded border border-dashed p-5 text-sm text-gray-600">Search to find registered citizens.</p>}</section>{selected ? <div className="space-y-4"><section className="rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-emerald-950/30"><h2 className="text-xl font-bold">{selected.user.name}</h2><p className="text-sm">Unique ID: {selected.user.uniqueId} | Father: {selected.user.fatherName || '-'} | Mobile: {selected.user.phone}</p><p className="text-sm">Email: {selected.user.email || '-'} | Aadhaar: {selected.user.aadhaar}</p><p className="text-sm">Village: {selected.user.village || '-'} | Ward: {selected.user.ward || '-'} | Status: {selected.user.status}</p></section><div className="grid gap-4 md:grid-cols-2"><RecordList title="Applications" records={selected.applications} render={(item) => <><p className="font-semibold">{item.applicationNumber} | {item.serviceType}</p><p>Status: {item.status} | Submitted: {formatDate(item.createdAt)}</p><p>{item.adminRemarks || ''}</p>{[...(item.documents || []), ...(item.adminDocuments || [])].map((document, index) => <a key={`${document.fileName}-${index}`} href={document.viewUrl} target="_blank" rel="noreferrer" className="mr-3 text-blue-700 underline">{document.fileName || 'Document'}</a>)}</>} /><RecordList title="Appointments" records={selected.appointments} render={(item) => <><p className="font-semibold">{item.appointmentNumber} | {item.service}</p><p>{formatDate(item.appointmentDate)} {item.appointmentTime} | {item.status}</p><p>{item.purpose}</p></>} /><RecordList title="Queries" records={selected.queries} render={(item) => <><p className="font-semibold">{item.queryId} | {item.subject}</p><p>{item.category} | {item.status} | Priority: {item.priority}</p><p>{item.description}</p></>} /><RecordList title="Document Vault" records={selected.documents} render={(item) => <><p className="font-semibold">{item.documentType}</p><p>{item.fileName} | {item.uploadedBy} | {formatDate(item.createdAt)}</p><a href={item.viewUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">View document</a></>} /><RecordList title="Voter Records" records={selected.voterRecords} render={(item) => <><p className="font-semibold">{item.elector_name || item.name || item.voterName || '-'}</p><p>Voter ID: {item.voterId || '-'} | Age: {item.age || item.voterAge || '-'} | Gender: {item.gender || item.voterGender || '-'}</p><p>Guardian: {item.parent_name || item.voterGuardianName || '-'}</p></>} /><RecordList title="Chat Records" records={selected.chats} render={(item) => <><p>{item.sender || 'User'} | {formatDate(item.createdAt)}</p><p>{item.message}</p></>} /></div></div> : <p className="rounded-lg border border-dashed p-8 text-sm text-gray-600">Select a citizen to view the complete profile.</p>}</div></main>;
}
