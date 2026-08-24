"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ServiceApplicationForm({ serviceType, fields, requiredDocuments = [] }) {
  const { status } = useSession();
  const [values, setValues] = useState({});
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function onFiles(event) {
    const files = Array.from(event.target.files || []);
    try {
      const parsed = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) return reject(new Error('Only PDF, JPG, and PNG documents are allowed.'));
        if (file.size > MAX_FILE_SIZE) return reject(new Error('Each document must be smaller than 5 MB.'));
        const reader = new FileReader();
        reader.onload = () => resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
        reader.onerror = () => reject(new Error('Unable to read document.'));
        reader.readAsDataURL(file);
      })));
      setDocuments(parsed); setMessage('');
    } catch (error) { setMessage(error.message); }
  }
  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setMessage('');
    if (requiredDocuments.length && !documents.length) {
      setSubmitting(false);
      return setMessage('Please upload at least one required supporting document.');
    }
    const response = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceType, formData: values, documents }) });
    const data = await response.json(); setSubmitting(false);
    if (!response.ok) return setMessage(data.message || 'Your application could not be submitted. Please try again.');
    setMessage(`Submitted successfully. Your reference number is ${data.applicationNumber}.`);
  }
  if (status === 'loading') return <p className="pt-36 text-center">Loading your application…</p>;
  if (status === 'unauthenticated') return <div className="rounded border border-green-200 bg-green-50 p-4 text-green-900"><p>Sign in to submit a personal application. You can prepare the required service details and supporting PDF, JPG, or PNG documents first.</p><Link href={`/signin?callbackUrl=${encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.pathname)}`} className="mt-3 inline-block rounded bg-green-700 px-4 py-2 text-white">Sign in to apply</Link></div>;
  return <form onSubmit={submit} className="space-y-4">
    {fields.map((field) => <div key={field.name}><label className="block text-sm font-semibold text-gray-700">{field.label} {field.required ? '*' : '(Optional)'}</label>{field.multiline ? <textarea required={field.required} value={values[field.name] || ''} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} className="mt-1 w-full border rounded p-2" rows="3" /> : <input type={field.type || 'text'} required={field.required} value={values[field.name] || ''} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} className="mt-1 w-full border rounded p-2" />}</div>)}
    <div><label className="block text-sm font-semibold text-gray-700">Supporting documents (PDF, JPG, PNG; {requiredDocuments.length ? 'required' : 'optional'})</label>{requiredDocuments.length > 0 && <p className="mt-1 text-xs text-gray-600">Upload at least one: {requiredDocuments.join(', ')}.</p>}<input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={onFiles} className="mt-1 w-full border rounded p-2" />{documents.length > 0 && <p className="mt-1 text-sm text-gray-600">{documents.length} document(s) ready to upload.</p>}</div>
    {message && <p className={message.startsWith('Submitted') ? 'text-green-700' : 'text-red-700'}>{message}</p>}<button type="submit" disabled={submitting} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit application'}</button>
  </form>;
}
