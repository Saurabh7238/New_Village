"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast, ToastContainer } from './Toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ServiceApplicationForm({ serviceType, fields, requiredDocuments = [], includeContactFields = false }) {
  const { status } = useSession();
  const { toasts, addToast, removeToast } = useToast();
  const [values, setValues] = useState({});
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!includeContactFields || status !== 'authenticated') return;
    fetch('/api/me').then((res) => res.ok ? res.json() : null).then((data) => {
      if (!data?.user) return;
      setValues((current) => ({
        ...current,
        applicantName: current.applicantName || data.user.name || '',
        applicantMobile: current.applicantMobile || data.user.phone || '',
        applicantEmail: current.applicantEmail || data.user.email || '',
      }));
    });
  }, [includeContactFields, status]);
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/applications').then((res) => res.ok ? res.json() : null).then((data) => setApplications(data?.applications || [])).catch(() => setApplications([]));
  }, [status]);
  
  // Poll for application updates every 5 seconds when authenticated
  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(() => {
      fetch('/api/applications').then((res) => res.ok ? res.json() : null).then((data) => setApplications(data?.applications || [])).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);
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
      setDocuments(parsed);
      addToast(`${parsed.length} document(s) uploaded successfully. You can submit the service now.`, 'success');
    } catch (error) {
      addToast(error.message, 'error');
    }
  }
  async function submit(event) {
    event.preventDefault(); setSubmitting(true);
    if (requiredDocuments.length && !documents.length) {
      setSubmitting(false);
      return addToast('Please upload at least one required supporting document.', 'error');
    }
    const response = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceType, formData: values, documents }) });
    const data = await response.json(); 
    setSubmitting(false);
    if (!response.ok) {
      return addToast(data.message || 'Your application could not be submitted. Please try again.', 'error');
    }
    // Clear form and documents on success
    setValues({});
    setDocuments([]);
    // Reload applications list
    fetch('/api/applications').then((res) => res.ok ? res.json() : null).then((data) => setApplications(data?.applications || [])).catch(() => setApplications([]));
    // Show success toast
    addToast(`Submitted successfully. Your reference number is ${data.applicationNumber}.`, 'success', 5000);
  }
  if (status === 'loading') return <p className="pt-36 text-center">Loading your application…</p>;
  if (status === 'unauthenticated') return <div className="rounded border border-green-200 bg-green-50 p-4 text-green-900"><p>Sign in to submit a personal application. You can prepare the required service details and supporting PDF, JPG, or PNG documents first.</p><Link href={`/signin?callbackUrl=${encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.pathname)}`} className="mt-3 inline-block rounded bg-green-700 px-4 py-2 text-white">Sign in to apply</Link></div>;
  const myApplications = applications.filter((application) => application.serviceType === serviceType);
  return <><form onSubmit={submit} className="space-y-4">
    {includeContactFields && <div className="space-y-4 rounded border border-green-200 bg-green-50 p-4"><p className="text-sm font-semibold text-green-900">Applicant details</p><div><label className="block text-sm font-semibold text-gray-700">Name *</label><input required type="text" value={values.applicantName || ''} onChange={(e) => setValues({ ...values, applicantName: e.target.value })} className="mt-1 w-full border rounded p-2" /></div><div><label className="block text-sm font-semibold text-gray-700">Mobile Number *</label><input required type="tel" inputMode="numeric" maxLength="10" value={values.applicantMobile || ''} onChange={(e) => setValues({ ...values, applicantMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="mt-1 w-full border rounded p-2" /></div><div><label className="block text-sm font-semibold text-gray-700">Email (Optional)</label><input type="email" value={values.applicantEmail || ''} onChange={(e) => setValues({ ...values, applicantEmail: e.target.value })} className="mt-1 w-full border rounded p-2" /></div></div>}
    {fields.map((field) => <div key={field.name}><label className="block text-sm font-semibold text-gray-700">{field.label} {field.required ? '*' : '(Optional)'}</label>{field.multiline ? <textarea required={field.required} value={values[field.name] || ''} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} className="mt-1 w-full border rounded p-2" rows="3" /> : <input type={field.type || 'text'} min={field.min} max={field.max} required={field.required} value={values[field.name] || ''} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} className="mt-1 w-full border rounded p-2" />}</div>)}
    <div><label className="block text-sm font-semibold text-gray-700">Supporting documents (PDF, JPG, PNG; {requiredDocuments.length ? 'required' : 'optional'})</label>{requiredDocuments.length > 0 && <p className="mt-1 text-xs text-gray-600">Upload at least one: {requiredDocuments.join(', ')}.</p>}<input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={onFiles} className="mt-1 w-full border rounded p-2" />{documents.length > 0 && <p className="mt-1 text-sm text-gray-600">{documents.length} document(s) ready to upload.</p>}</div>
    <button type="submit" disabled={submitting} className="min-h-12 w-full rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto">{submitting ? 'Submitting…' : 'Submit application'}</button>
  </form>
  <ToastContainer toasts={toasts} removeToast={removeToast} isDark={false} />{myApplications.length > 0 && <section className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-gray-800"><h2 className="text-lg font-bold text-green-800">Your {serviceType.replace(/-/g, ' ')} updates</h2><div className="mt-3 space-y-3">{myApplications.map((application) => <article key={application.id} className="rounded border border-green-100 bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{application.applicationNumber}</strong><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">{application.status}</span></div>{application.adminRemarks && <p className="mt-2 text-sm"><strong>Admin remark:</strong> {application.adminRemarks}</p>}{application.adminDocuments?.length > 0 && <div className="mt-2 text-sm"><strong>Documents from Panchayat:</strong><ul className="mt-1 list-disc pl-5">{application.adminDocuments.map((document, index) => <li key={`${document.fileName}-${index}`}><a href={document.fileUrl} download={document.fileName} className="text-green-700 underline">{document.fileName || `Document ${index + 1}`}</a></li>)}</ul></div>}</article>)}</div></section>}</>;
}
