"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
export default function AppointmentsPage() {
  const { status } = useSession(); const router = useRouter(); const [form, setForm] = useState({ service: 'Birth Certificate', appointmentDate: '', appointmentTime: '', purpose: '' }); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false);
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
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Service
            </label>
            <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="mt-1 w-full border rounded p-2">
              <option>Birth Certificate</option>
              <option>Death Certificate</option>
              <option>Aadhar Update</option>
            </select>
          </div>
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
    </div>
  );
}
