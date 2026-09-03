'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN') : '-';

function RecordList({ title, records, children }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-3 text-lg font-bold">{title} ({records?.length || 0})</h2>
      {records?.length ? <div className="space-y-2">{records.map((record, index) => <div key={record.id || record._id || index} className="rounded border p-3 text-sm">{children(record)}</div>)}</div> : <p className="text-sm text-gray-500">No records found.</p>}
    </section>
  );
}

export default function AdminUserDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/users/${id}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load citizen details.');
        setData(payload);
      })
      .catch((loadError) => setError(loadError.message));
  }, [id]);

  if (error) return <main className="mx-auto max-w-7xl px-4 py-8"><Link href="/admin/users" className="text-sm font-semibold text-green-700 hover:underline">Back to Citizen Directory</Link><p className="mt-6 rounded bg-red-50 p-4 text-red-700">{error}</p></main>;
  if (!data) return <main className="mx-auto max-w-7xl px-4 py-8">Loading citizen details...</main>;

  const { user } = data;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/admin/users" className="text-sm font-semibold text-green-700 hover:underline">Back to Citizen Directory</Link>
      <section className="mt-4 rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-emerald-950/30">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <p>Unique ID: {user.uniqueId || '-'}</p><p>Father: {user.fatherName || '-'}</p><p>Mobile: {user.phone || '-'}</p><p>Email: {user.email || '-'}</p><p>Aadhaar: {user.aadhaar || 'Not available'}</p><p>Date of Birth: {formatDate(user.dateOfBirth)}</p><p>Ward: {user.ward || '-'}</p><p>Status: {user.status || 'active'}</p>
        </div>
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RecordList title="Applications" records={data.applications}>{(item) => <><p className="font-semibold">{item.applicationNumber} | {item.serviceType} | {item.status}</p><p>{item.adminRemarks || 'No admin remarks'}</p><p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p></>}</RecordList>
        <RecordList title="Appointments" records={data.appointments}>{(item) => <><p className="font-semibold">{item.appointmentNumber} | {item.status}</p><p>{item.purpose}</p><p className="text-xs text-gray-500">{formatDate(item.appointmentDate)} at {item.appointmentTime}</p></>}</RecordList>
        <RecordList title="Queries" records={data.queries}>{(item) => <><p className="font-semibold">{item.queryId} | {item.status}</p><p>{item.subject || item.description}</p><p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p></>}</RecordList>
        <RecordList title="Document Vault" records={data.documents}>{(item) => <><p className="font-semibold">{item.documentType}</p><p>{item.fileName} | {item.uploadedBy === 'admin' ? 'Panchayat office' : 'Citizen'}</p><a href={item.viewUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">View document</a></>}</RecordList>
        <RecordList title="Voter Records" records={data.voterRecords}>{(item) => <p>{item.elector_name || item.name || '-'} | {item.epic_number || item.epicNumber || '-'}</p>}</RecordList>
        <RecordList title="Chat Records" records={data.chats}>{(item) => <><p>{item.sender}: {item.message}</p><p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p></>}</RecordList>
      </div>
    </main>
  );
}
