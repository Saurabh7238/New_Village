'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const SERVICE_OPTIONS = [
  { value: 'birth', label: 'Birth certificate / जन्म प्रमाण पत्र' },
  { value: 'death', label: 'Death certificate / मृत्यु प्रमाण पत्र' },
  { value: 'grievance', label: 'Grievance / शिकायत' },
  { value: 'voter', label: 'Voter services / मतदाता सेवाएँ' },
];

const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'Hindi',
  bilingual: 'Bilingual / द्विभाषी',
};

function readPdf(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected PDF.'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminFormsPage() {
  const { data: session, status } = useSession();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [title, setTitle] = useState('');
  const [service, setService] = useState('birth');
  const [language, setLanguage] = useState('bilingual');
  const [sourceNote, setSourceNote] = useState('');
  const [file, setFile] = useState(null);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/public-forms', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load forms.');
      setForms(data.forms || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load forms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') loadForms();
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      setLoading(false);
    }
  }, [status, session?.user?.role, loadForms]);

  const publish = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage('');
    setError('');

    if (!file || file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) {
      setError('Choose a PDF file under 5 MB.');
      return;
    }
    if (!verified) {
      setError('Confirm that the PDF is approved for public use before publishing.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/public-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          service,
          language,
          sourceNote,
          verified,
          fileName: file.name,
          fileData: await readPdf(file),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to publish the form.');

      setMessage(data.message);
      setTitle('');
      setSourceNote('');
      setFile(null);
      setVerified(false);
      formElement.reset();
      await loadForms();
    } catch (publishError) {
      setError(publishError.message || 'Unable to publish the form.');
    } finally {
      setSaving(false);
    }
  };

  const removeForm = async (form) => {
    if (!window.confirm(`Remove "${form.title}" from public downloads?`)) return;
    setRemovingId(form.id);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/public-forms/${encodeURIComponent(form.id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to remove the form.');
      setMessage(data.message);
      await loadForms();
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove the form.');
    } finally {
      setRemovingId(null);
    }
  };

  if (status === 'loading') {
    return <main className="mx-auto max-w-4xl p-6">Loading account…</main>;
  }

  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return <main className="mx-auto max-w-4xl p-6"><p role="alert">Admin access required.</p></main>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 text-slate-900 dark:text-white">
      <header>
        <Link href="/admin" className="text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">
          Back to admin / व्यवस्थापक पैनल
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Public forms / सार्वजनिक फॉर्म</h1>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          Only publish forms approved for public use. Your approval confirmation and source/reference are recorded for auditing.
          Published PDFs are visible to everyone.
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
          केवल सार्वजनिक उपयोग के लिए स्वीकृत फॉर्म प्रकाशित करें। आपकी पुष्टि और स्रोत/संदर्भ ऑडिट के लिए दर्ज किए जाते हैं।
          प्रकाशित PDF सभी को दिखाई देंगे।
        </p>
      </header>

      <form onSubmit={publish} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Publish a verified PDF / सत्यापित PDF प्रकाशित करें</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="form-title" className="mb-1 block text-sm font-semibold">Form title / फॉर्म का नाम</label>
            <input id="form-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="form-service" className="mb-1 block text-sm font-semibold">Service / सेवा</label>
            <select id="form-service" value={service} onChange={(event) => setService(event.target.value)} className="min-h-11 w-full rounded-lg border px-3 py-2">
              {SERVICE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="form-language" className="mb-1 block text-sm font-semibold">Language / भाषा</label>
            <select id="form-language" value={language} onChange={(event) => setLanguage(event.target.value)} className="min-h-11 w-full rounded-lg border px-3 py-2">
              <option value="en">English</option>
              <option value="hi">Hindi / हिंदी</option>
              <option value="bilingual">Bilingual / द्विभाषी</option>
            </select>
          </div>
          <div>
            <label htmlFor="form-pdf" className="mb-1 block text-sm font-semibold">PDF file (max 5 MB) / PDF फ़ाइल</label>
            <input
              id="form-pdf"
              type="file"
              accept="application/pdf,.pdf"
              required
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="min-h-11 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label htmlFor="form-source" className="mb-1 block text-sm font-semibold">
            Approval source/reference / स्वीकृति का स्रोत या संदर्भ
          </label>
          <input
            id="form-source"
            required
            maxLength={300}
            value={sourceNote}
            onChange={(event) => setSourceNote(event.target.value)}
            placeholder="Issuing authority, circular number, or approval reference"
            className="min-h-11 w-full rounded-lg border px-3 py-2"
          />
        </div>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
          <span>
            I confirm this is the current approved form and is cleared for public download.
            <span className="mt-1 block text-slate-700 dark:text-slate-300">
              मैं पुष्टि करता/करती हूँ कि यह वर्तमान स्वीकृत फॉर्म है और सार्वजनिक डाउनलोड के लिए अनुमोदित है।
            </span>
          </span>
        </label>
        {message && <p role="status" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}
        {error && <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
        <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-sky-700 px-5 py-2 font-bold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Publishing… / प्रकाशित हो रहा है…' : 'Publish form / फॉर्म प्रकाशित करें'}
        </button>
      </form>

      <section aria-labelledby="published-forms-heading">
        <h2 id="published-forms-heading" className="mb-3 text-xl font-bold">Published forms / प्रकाशित फॉर्म</h2>
        {loading ? (
          <p role="status">Loading forms…</p>
        ) : error && forms.length === 0 ? (
          <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>
        ) : forms.length ? (
          <ul className="space-y-3">
            {forms.map((form) => (
              <li key={form.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="min-w-0">
                  <p className="font-bold">{form.title}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {SERVICE_OPTIONS.find((option) => option.value === form.service)?.label} · {LANGUAGE_LABELS[form.language]} · {formatBytes(form.fileSize)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{form.fileName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Source: {form.sourceNote}</p>
                </div>
                <button
                  type="button"
                  disabled={removingId === form.id}
                  onClick={() => removeForm(form)}
                  className="min-h-11 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  {removingId === form.id ? 'Removing…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-slate-700 dark:border-slate-600 dark:text-slate-300">
            No public forms have been published yet.
          </p>
        )}
      </section>
    </main>
  );
}
