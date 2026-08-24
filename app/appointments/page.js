"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
export default function AppointmentsPage() {
  const { status } = useSession(); const router = useRouter(); const [form, setForm] = useState({ appointmentDate: '', appointmentTime: '', purpose: '' }); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/appointments').then((res) => res.ok ? res.json() : null).then((data) => setAppointments(data?.appointments || []));
  }, [status]);
  const loadAppointments = () => fetch('/api/appointments').then((res) => res.ok ? res.json() : null).then((data) => setAppointments(data?.appointments || []));
  async function submit(e) { e.preventDefault(); if (status !== 'authenticated') return router.push('/signin?callbackUrl=%2Fappointments'); setLoading(true); const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await res.json(); setLoading(false); if (res.ok) { setMessage(`Appointment requested. Reference: ${data.appointmentNumber}`); setForm({ appointmentDate: '', appointmentTime: '', purpose: '' }); loadAppointments(); } else setMessage(data.message || 'Unable to book appointment.'); }
  async function submit(e) { e.preventDefault(); if (status !== 'authenticated') return router.push('/signin?callbackUrl=%2Fappointments'); setLoading(true); const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await res.json(); setLoading(false); setMessage(res.ok ? `Appointment requested. Reference: ${data.appointmentNumber}` : (data.message || 'Unable to book appointment.')); }
  if (status === 'loading') return <p className="pt-36 text-center">Loading…</p>;
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
          <p className="rounded bg-gray-50 p-3 text-sm text-gray-600">The Panchayat office will review your purpose and confirm the appropriate service.</p>
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Date
            </label>
            <input required type="date" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} className="mt-1 w-full border rounded p-2" />
          </div>
          <div><label className="block text-sm font-semibold text-gray-700">Time</label><input required type="time" value={form.appointmentTime} onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })} className="mt-1 w-full border rounded p-2" /></div>
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
      {status === 'authenticated' && <div className="mt-6 rounded-lg bg-white p-6 shadow"><h2 className="mb-3 text-xl font-bold text-green-700">My Appointments</h2>{appointments.length ? <div className="space-y-2">{appointments.map((appointment) => <div key={appointment.id} className="flex flex-wrap items-center justify-between rounded border p-3 text-sm"><span><strong>{appointment.appointmentNumber}</strong> · {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}</span><span className="font-semibold text-green-700">{appointment.status}</span></div>)}</div> : <p className="text-sm text-gray-600">No appointments booked yet.</p>}</div>}
    </div>
  );
}
