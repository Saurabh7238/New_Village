"use client";

import { useEffect, useState } from 'react';

const fields = [['name', 'Full Name'], ['phone', 'Mobile Number'], ['email', 'Email'], ['village', 'Village'], ['ward', 'Ward Number'], ['address', 'Address'], ['profilePhoto', 'Profile Photo URL']];

export default function ProfilePage() {
  const [form, setForm] = useState(null); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { fetch('/api/me').then((r) => r.json()).then((data) => setForm(data.user || null)); }, []);
  const save = async (event) => { event.preventDefault(); setSaving(true); setMessage(''); const res = await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await res.json(); setSaving(false); if (res.ok) { setForm(data.user); setMessage('Profile updated successfully.'); } else setMessage(data.message || 'Unable to update profile.'); };
  if (!form) return <p className="py-8 text-center text-gray-600">Loading profile...</p>;
  return <div className="mx-auto max-w-2xl py-4"><form onSubmit={save} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><h1 className="text-2xl font-bold text-green-700 dark:text-green-300">My Profile</h1><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Your Citizen ID: {form.uniqueId}</p><div className="mt-5 space-y-4">{fields.map(([key, label]) => <label key={key} className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}{key === 'address' ? <textarea value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 block w-full rounded-md border p-2 text-gray-900" rows="3" /> : <input type={key === 'email' ? 'email' : key === 'ward' ? 'number' : 'text'} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 block w-full rounded-md border p-2 text-gray-900" />}</label>)}</div><p className="mt-4 text-xs text-gray-500">Account created: {new Date(form.createdAt).toLocaleDateString()}</p>{message && <p className="mt-3 text-sm text-green-700">{message}</p>}<button disabled={saving} className="mt-4 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Profile'}</button></form></div>;
}
