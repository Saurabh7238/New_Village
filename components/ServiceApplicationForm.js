"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastContainer } from './Toast';
import LoginRequiredModal from './LoginRequiredModal';
import DocumentChecklist from './DocumentChecklist';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function calculateAgeFromDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export default function ServiceApplicationForm({
  serviceType,
  fields,
  requiredDocuments = [],
  includeContactFields = false,
}) {
  const { status } = useSession();
  const { toasts, addToast, removeToast } = useToast();
  const [values, setValues] = useState({});
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const todayString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!includeContactFields || status !== 'authenticated') return;
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
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
    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setApplications(data?.applications || []))
      .catch(() => setApplications([]));
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(() => {
      fetch('/api/applications')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setApplications(data?.applications || []))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [status]);

  async function onFiles(event) {
    const files = Array.from(event.target.files || []);
    try {
      const parsed = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                return reject(new Error('Only PDF, JPG, and PNG documents are allowed.'));
              }
              if (file.size > MAX_FILE_SIZE) {
                return reject(new Error('Each document must be smaller than 5 MB.'));
              }
              const reader = new FileReader();
              reader.onload = () =>
                resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
              reader.onerror = () => reject(new Error('Unable to read document.'));
              reader.readAsDataURL(file);
            })
        )
      );

      setDocuments(parsed);
      addToast(`${parsed.length} document(s) uploaded successfully. You can submit the service now.`, 'success');
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (status === 'unauthenticated') {
      setShowLoginWarning(true);
      return;
    }

    setSubmitting(true);

    if (requiredDocuments.length && !documents.length) {
      setSubmitting(false);
      return addToast('Please upload at least one required supporting document.', 'error');
    }

    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType, formData: values, documents }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      return addToast(data.message || 'Your application could not be submitted. Please try again.', 'error');
    }

    setValues({});
    setDocuments([]);

    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setApplications(payload?.applications || []))
      .catch(() => setApplications([]));

    addToast(`Submitted successfully. Your reference number is ${data.applicationNumber}.`, 'success', 5000);
  }

  async function uploadMoreDocuments(applicationId, files) {
    const selected = Array.from(files || []);
    if (!selected.length) return;

    if (
      selected.length > 5 ||
      selected.some(
        (file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > MAX_FILE_SIZE
      )
    ) {
      return addToast('Choose up to five PDF, JPG, or PNG documents under 5 MB each.', 'error');
    }

    const docs = await Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
            reader.onerror = () => reject(new Error('Unable to read document.'));
            reader.readAsDataURL(file);
          })
      )
    );

    const response = await fetch(`/api/applications/${applicationId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: docs }),
    });
    const data = await response.json();

    if (!response.ok) {
      return addToast(data.message || 'Unable to upload additional documents.', 'error');
    }

    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setApplications(payload?.applications || []))
      .catch(() => setApplications([]));

    addToast(data.message || 'Additional documents uploaded successfully.', 'success');
  }

  if (status === 'loading') {
    return <p className="pt-36 text-center">Loading your application…</p>;
  }

  const myApplications = applications.filter((application) => application.serviceType === serviceType);

  return (
    <>
      <DocumentChecklist documents={requiredDocuments} />

      <form onSubmit={submit} className="space-y-4">
        {includeContactFields && (
          <div className="space-y-4 rounded border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-emerald-950/40">
            <p className="text-sm font-semibold text-green-900 dark:text-emerald-200">Applicant details</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Name *</label>
              <input
                required
                type="text"
                value={values.applicantName || ''}
                onChange={(e) => setValues({ ...values, applicantName: e.target.value })}
                className="mt-1 w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Mobile Number *</label>
              <input
                required
                type="tel"
                inputMode="numeric"
                maxLength="10"
                value={values.applicantMobile || ''}
                onChange={(e) =>
                  setValues({
                    ...values,
                    applicantMobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
                className="mt-1 w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Email (Optional)</label>
              <input
                type="email"
                value={values.applicantEmail || ''}
                onChange={(e) => setValues({ ...values, applicantEmail: e.target.value })}
                className="mt-1 w-full rounded border p-2"
              />
            </div>
          </div>
        )}

        {fields.map((field) => {
          const isBirthDob = field.name === 'dateOfBirth' || field.name === 'dob';
          const isBirthAge = serviceType === 'birth-certificate' && field.name === 'applicantAge';
          const inputMax = isBirthDob ? todayString : field.max;

          return (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required ? '*' : '(Optional)'}
              </label>
              {field.multiline ? (
                <textarea
                  required={field.required}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  className="mt-1 w-full rounded border p-2"
                  rows="3"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  min={field.min}
                  max={inputMax}
                  required={field.required}
                  readOnly={field.readOnly || isBirthAge}
                  value={values[field.name] || ''}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setValues((current) => {
                      const nextData = { ...current, [field.name]: nextValue };

                      if (isBirthDob) {
                        const computedAge = calculateAgeFromDate(nextValue);
                        if (computedAge !== '') {
                          nextData.applicantAge = computedAge;
                        }
                      }

                      return nextData;
                    });
                  }}
                  className="mt-1 w-full rounded border p-2"
                />
              )}
            </div>
          );
        })}

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Supporting documents (PDF, JPG, PNG; {requiredDocuments.length ? 'required' : 'optional'})
          </label>
          {requiredDocuments.length > 0 && (
            <p className="mt-1 text-xs text-gray-600">
              Upload at least one: {requiredDocuments.join(', ')}.
            </p>
          )}
          <input
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png"
            onChange={onFiles}
            className="mt-1 w-full rounded border p-2"
          />
          {documents.length > 0 && (
            <p className="mt-1 text-sm text-gray-600">{documents.length} document(s) ready to upload.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 w-full rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>

      <ToastContainer toasts={toasts} removeToast={removeToast} isDark={false} />

      {showLoginWarning && (
        <LoginRequiredModal
          isOpen={showLoginWarning}
          onClose={() => setShowLoginWarning(false)}
          callbackUrl={typeof window === 'undefined' ? '/' : window.location.pathname}
        />
      )}

      {myApplications.length > 0 && (
        <section className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-gray-800 dark:border-green-900 dark:bg-emerald-950/40 dark:text-slate-100">
          <h2 className="text-lg font-bold text-green-800">Your {serviceType.replace(/-/g, ' ')} updates</h2>
          <div className="mt-3 space-y-3">
            {myApplications.map((application) => (
              <article
                key={application.id}
                className="rounded border border-green-100 bg-white p-3 dark:border-green-900 dark:bg-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{application.applicationNumber}</strong>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                    {application.status}
                  </span>
                </div>

                {application.adminRemarks && (
                  <p className="mt-2 text-sm">
                    <strong>Admin remark:</strong> {application.adminRemarks}
                  </p>
                )}

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {application.documents?.length > 0 && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        Your uploaded documents
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {application.documents.map((document, index) => (
                          <li key={`citizen-${document.fileName || index}`}>
                            <a
                              href={document.fileUrl}
                              download={document.fileName}
                              className="text-emerald-700 underline dark:text-emerald-300"
                            >
                              {document.fileName || `Document ${index + 1}`}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {application.adminDocuments?.length > 0 && (
                    <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Documents from Panchayat
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {application.adminDocuments.map((document, index) => (
                          <li key={`admin-${document.fileName || index}`}>
                            <a
                              href={document.fileUrl}
                              download={document.fileName}
                              className="text-amber-700 underline dark:text-amber-300"
                            >
                              {document.fileName || `Document ${index + 1}`}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {(application.status === 'Need Documents' ||
                  application.status === 'Updated' ||
                  application.status === 'Rejected') && (
                  <div className="mt-3 rounded border border-dashed border-orange-300 bg-orange-50 p-3 dark:border-orange-700 dark:bg-orange-950/20">
                    <label className="block text-sm font-semibold text-orange-700 dark:text-orange-200">
                      Upload additional documents
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(event) => uploadMoreDocuments(application.id, event.target.files)}
                      className="mt-2 block w-full rounded border border-orange-200 bg-white p-2 text-xs dark:border-orange-700 dark:bg-slate-800"
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
