"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Rescheduled', 'Cancelled', 'Completed'];

function dateValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function AdminAppointmentsPage() {
  const { data: session, status: authStatus } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    try {
      const response = await fetch(`/api/admin/appointments?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setAppointments(data.appointments || []);
    } catch (error) { setMessage(error.message || 'Unable to load appointments.'); }
    finally { setLoading(false); }
  };

  // Fetch when the admin session or selected status changes; search uses the explicit button.
  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'admin') fetchAppointments();
  }, [authStatus, session?.user?.role, status]);

  const changeLocal = (id, field, value) => setAppointments((rows) => rows.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const saveAppointment = async (appointment) => {
    setSavingId(appointment.id); setMessage('');
    try {
      const response = await fetch('/api/admin/appointments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: appointment.id, status: appointment.status, adminRemarks: appointment.adminRemarks, appointmentDate: dateValue(appointment.appointmentDate), appointmentTime: appointment.appointmentTime }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(`Appointment ${appointment.appointmentNumber} updated and the citizen was notified.`);
      fetchAppointments();
    } catch (error) { setMessage(error.message || 'Unable to update appointment.'); }
    finally { setSavingId(null); }
  };

  if (authStatus === 'loading') return <div className="p-8 text-center">Loading…</div>;
  if (authStatus === 'unauthenticated' || session?.user?.role !== 'admin') return <div className="min-h-screen p-8 text-center text-red-600">Access denied.</div>;

  return <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between gap-4"><h1 className="text-3xl font-bold text-green-700 dark:text-yellow-400">Appointment Management</h1><Link href="/admin" className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">Back to Admin</Link></div>
      {message && <p className={`mb-4 rounded p-3 ${message.includes('Unable') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{message}</p>}
      <div className="mb-6 grid gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-3 dark:bg-gray-800"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference or purpose" className="rounded border p-2 dark:bg-gray-700" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded border p-2 dark:bg-gray-700"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select><button onClick={fetchAppointments} className="rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800">Search</button></div>
      <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-3">Reference / Citizen</th><th className="p-3">Purpose</th><th className="p-3">Date & Time</th><th className="p-3">Status</th><th className="p-3">Admin remarks</th><th className="p-3">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="p-8 text-center">Loading appointments…</td></tr> : appointments.length === 0 ? <tr><td colSpan="6" className="p-8 text-center">No appointments found.</td></tr> : appointments.map((appointment) => <tr key={appointment.id} className="border-t align-top dark:border-gray-700"><td className="p-3"><p className="font-bold text-green-700">{appointment.appointmentNumber}</p><p>{appointment.userId?.name || 'Citizen'}</p><p className="text-xs text-gray-500">{appointment.userId?.phone} · {appointment.userId?.email || 'No email'}</p></td><td className="p-3">{appointment.purpose}</td><td className="space-y-2 p-3"><input type="date" value={dateValue(appointment.appointmentDate)} onChange={(event) => changeLocal(appointment.id, 'appointmentDate', event.target.value)} className="w-full rounded border p-2 dark:bg-gray-700" /><input type="time" value={appointment.appointmentTime || ''} onChange={(event) => changeLocal(appointment.id, 'appointmentTime', event.target.value)} className="w-full rounded border p-2 dark:bg-gray-700" /></td><td className="p-3"><select value={appointment.status} onChange={(event) => changeLocal(appointment.id, 'status', event.target.value)} className="rounded border p-2 dark:bg-gray-700">{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></td><td className="p-3"><textarea value={appointment.adminRemarks || ''} onChange={(event) => changeLocal(appointment.id, 'adminRemarks', event.target.value)} rows="3" className="w-full rounded border p-2 dark:bg-gray-700" placeholder="Message for the citizen" /></td><td className="p-3"><button disabled={savingId === appointment.id} onClick={() => saveAppointment(appointment)} className="rounded bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{savingId === appointment.id ? 'Saving…' : 'Save update'}</button></td></tr>)}</tbody></table></div>
    </div>
  </div>;
}
