"use client";
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';import LoginRequiredModal from '@/components/LoginRequiredModal';import LoadingSpinner from '@/components/LoadingSpinner';export default function AppointmentsPage() {
  const { status } = useSession(); const router = useRouter(); const [form, setForm] = useState({ purpose: '' }); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const [appointments, setAppointments] = useState([]); const [updates, setUpdates] = useState({}); const [showLoginWarning, setShowLoginWarning] = useState(false); const [page, setPage] = useState(1); const [pagination, setPagination] = useState({ pages: 1 });
  const loadAppointments = useCallback(() => fetch(`/api/appointments?page=${page}&limit=10`).then((res) => res.ok ? res.json() : null).then((data) => { setAppointments(data?.appointments || []); setPagination(data?.pagination || { pages: 1 }); }), [page]);
  useEffect(() => {
    if (status !== 'authenticated') return;
    loadAppointments();
    fetch('/api/service-notifications').then((res) => res.ok ? res.json() : null).then((data) => setUpdates(Object.fromEntries((data?.notifications || []).filter((note) => note.relatedType === 'appointment').map((note) => [note.relatedId, note]))));
  }, [loadAppointments, status]);
  const viewUpdate = async (appointment) => { const notification = updates[appointment.id]; if (!notification) return; await fetch('/api/service-notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: notification.id }) }); setUpdates((current) => { const next = { ...current }; delete next[appointment.id]; return next; }); };
  async function submit(e) { e.preventDefault(); if (status !== 'authenticated') { setShowLoginWarning(true); return; } setLoading(true); const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await res.json(); setLoading(false); if (res.ok) { setMessage(`Appointment requested. Reference: ${data.appointmentNumber}. The Panchayat office will set your date and time.`); setForm({ purpose: '' }); loadAppointments(); } else setMessage(data.message || 'Unable to book appointment.'); }
  if (status === 'loading') return <LoadingSpinner message="Loading Appointments..." />;
  return (
    <div className="pt-36 max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Appointments
      </h1>
      <p className="text-gray-700 mb-6">
        Book appointments for Gram Panchayat services.
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-4" onSubmit={submit}>
          <p className="rounded bg-gray-50 p-3 text-sm text-gray-600">After you submit, the Panchayat office will review your request, add remarks, and set the appointment date and time. You can make one booking every 24 hours.</p>
          <div><label className="block text-sm font-semibold text-gray-700">Purpose</label><textarea required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="mt-1 w-full border rounded p-2" /></div>
          {message && <p className={message.startsWith('Appointment requested') ? 'text-green-700' : 'text-red-700'}>{message}</p>}
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
          >
            {loading ? 'Booking…' : 'Book Appointment'}
          </button>
        </form>
      </div>
      <LoginRequiredModal isOpen={showLoginWarning} onClose={() => setShowLoginWarning(false)} callbackUrl="/appointments" />
      {status === 'authenticated' && <div className="mt-6 rounded-lg bg-white p-6 shadow"><h2 className="mb-3 text-xl font-bold text-green-700">My Appointments</h2>{appointments.length ? <div className="space-y-2">{appointments.map((appointment) => <div key={appointment.id} className="rounded border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span><strong>{appointment.appointmentNumber}</strong> · {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}</span><div className="flex items-center gap-2">{updates[appointment.id] && <button onClick={() => viewUpdate(appointment)} className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">Updated</button>}<span className="font-semibold text-green-700">{appointment.status}</span></div></div>{appointment.adminRemarks && <p className="mt-2 border-t pt-2"><strong>Admin update:</strong> {appointment.adminRemarks}</p>}</div>)}</div> : <p className="text-sm text-gray-600">No appointments booked yet.</p>}</div>}
    </div>
  );
}
