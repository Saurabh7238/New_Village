"use client";

import { useEffect, useState } from 'react';
import { normalizePhone } from '@/lib/phoneValidation';

const fields = [['name', 'Full Name'], ['phone', 'Mobile Number'], ['email', 'Email'], ['village', 'Village'], ['ward', 'Ward Number'], ['address', 'Address'], ['profilePhoto', 'Profile Photo URL']];

export default function ProfilePage() {
  const [form, setForm] = useState(null);
  const [savedContact, setSavedContact] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((response) => response.json())
      .then((data) => {
        if (!data.user) return;
        setForm(data.user);
        setSavedContact({
          phone: normalizePhone(data.user.phone),
          email: (data.user.email || '').trim().toLowerCase(),
        });
      })
      .catch(() => setMessage('Unable to load profile. Please refresh the page.'));
  }, []);

  const sendVerificationCode = async () => {
    const response = await fetch('/api/me/email-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        phone: normalizePhone(form.phone),
        email: (form.email || '').trim().toLowerCase(),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to send verification code.');
    setVerificationPending(true);
    setMessage(data.message || 'Verification code sent.');
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const normalizedPhone = normalizePhone(form.phone);
    const normalizedEmail = (form.email || '').trim().toLowerCase();
    const contactChanged = normalizedPhone !== savedContact.phone || normalizedEmail !== savedContact.email;

    try {
      const profileUpdate = { ...form };
      if (contactChanged) {
        delete profileUpdate.phone;
        delete profileUpdate.email;
      }

      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdate),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update profile.');

      if (!contactChanged) {
        setForm(data.user);
        setMessage('Profile updated successfully.');
        return;
      }

      setForm({ ...data.user, phone: form.phone, email: form.email });
      await sendVerificationCode();
    } catch (error) {
      setMessage(error.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const verifyContact = async () => {
    setVerifying(true);
    setMessage('');
    try {
      const response = await fetch('/api/me/email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: verificationCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to verify contact details.');

      setForm(data.user);
      setSavedContact({ phone: normalizePhone(data.user.phone), email: (data.user.email || '').trim().toLowerCase() });
      setVerificationPending(false);
      setVerificationCode('');
      setMessage('Email and mobile number updated successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to verify contact details.');
    } finally {
      setVerifying(false);
    }
  };

  if (!form) return <p className="py-8 text-center text-slate-600 dark:text-slate-300">Loading profile...</p>;

  return (
    <div className="mx-auto max-w-2xl py-4">
      <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your Citizen ID: {form.uniqueId}</p>
        <div className="mt-5 space-y-4">
          {fields.map(([key, label]) => (
            <label key={key} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {label}
              {key === 'address' ? (
                <textarea
                  value={form[key] || ''}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  className="mt-1 block w-full rounded-md border p-2 text-slate-900 dark:bg-slate-800 dark:text-white"
                  rows="3"
                />
              ) : (
                <input
                  type={key === 'email' ? 'email' : key === 'ward' ? 'number' : 'text'}
                  value={form[key] || ''}
                  disabled={verificationPending && (key === 'email' || key === 'phone')}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  className="mt-1 block w-full rounded-md border p-2 text-slate-900 disabled:opacity-60 dark:bg-slate-800 dark:text-white"
                />
              )}
            </label>
          ))}
        </div>

        {verificationPending && (
          <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/40">
            <label htmlFor="profileVerificationCode" className="block text-sm font-semibold text-teal-900 dark:text-teal-100">
              Email verification code
              <input
                id="profileVerificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mt-1 block w-full rounded-md border border-teal-300 bg-white p-2 text-slate-900 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <p className="mt-2 text-xs text-teal-800 dark:text-teal-200">The code expires in 10 minutes. Your email and mobile number update after verification.</p>
            <button
              type="button"
              onClick={verifyContact}
              disabled={verifying || verificationCode.length !== 6}
              className="mt-3 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {verifying ? 'Verifying...' : 'Verify and Update Contact'}
            </button>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">Account created: {new Date(form.createdAt).toLocaleDateString()}</p>
        {message && <p role="status" className="mt-3 rounded-md bg-teal-50 p-2 text-sm text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">{message}</p>}
        <button
          type="submit"
          disabled={saving || verificationPending}
          className="mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {verificationPending && (
          <button
            type="button"
            onClick={async () => {
              setSaving(true);
              setMessage('');
              try {
                await sendVerificationCode();
              } catch (error) {
                setMessage(error.message || 'Unable to send verification code.');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="ml-3 mt-4 rounded-md border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60 dark:text-teal-200 dark:hover:bg-teal-950/40"
          >
            {saving ? 'Sending...' : 'Send New Code'}
          </button>
        )}
      </form>
    </div>
  );
}
