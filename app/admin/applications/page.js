"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast, ToastContainer } from '@/components/Toast';

const STATUSES = ['Submitted', 'Under Review', 'Need Documents', 'Approved', 'Rejected', 'Completed'];

function AdminApplicationsContent() {
  const { data: session, status: authStatus } = useSession();
  const { toasts, addToast, removeToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const searchParams = useSearchParams();
  const selectedService = searchParams.get('service') || '';

  const loadApplications = async () => {
    setLoading(true);
    const response = await fetch('/api/admin/applications');
    const data = response.ok ? await response.json() : { applications: [] };
    setApplications(data.applications || []);
    setLoading(false);
  };

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'admin') loadApplications();
  }, [authStatus, session?.user?.role]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'admin') {
      fetch('/api/service-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relatedType: 'application' })
      });
    }
  }, [authStatus, session?.user?.role]);

  const updateLocal = (id, key, value) => {
    setApplications((items) =>
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const viewDetails = async (id) => {
    setDetailsLoading(true);
    const response = await fetch(`/api/admin/applications/${id}`);
    const data = response.ok ? await response.json() : null;
    setSelectedApplication(data?.application || null);
    setDetailsLoading(false);
  };

  const updateDocuments = async (id, event) => {
    const files = Array.from(event.target.files || []);
    if (
      files.length > 5 ||
      files.some(
        (file) =>
          !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) ||
          file.size > 5 * 1024 * 1024
      )
    ) {
      return alert('Choose up to five PDF, JPG, or PNG documents under 5 MB each.');
    }
    const documents = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                fileName: file.name,
                fileUrl: reader.result,
                mimeType: file.type,
              });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
    updateLocal(id, 'adminDocuments', documents);
    addToast(`${documents.length} document(s) uploaded successfully. Click Save to confirm.`, 'success');
  };

  const save = async (application) => {
    setSavingId(application.id);
    const payload = {
      id: application.id,
      status: application.status,
      adminRemarks: application.adminRemarks,
    };
    if (application.adminDocuments !== undefined) {
      payload.adminDocuments = application.adminDocuments;
    }
    if (application.requestedDocuments !== undefined) {
      payload.requestedDocuments = String(application.requestedDocuments).split(',').map((document) => document.trim()).filter(Boolean);
    }
    const response = await fetch('/api/admin/applications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSavingId(null);
    if (response.ok) {
      addToast('Application updated successfully.', 'success');
      loadApplications();
    } else {
      addToast('Unable to update application.', 'error');
    }
  };

  const remove = async (application) => {
    if (
      !window.confirm(
        `Delete ${application.applicationNumber}? This cannot be undone.`
      )
    )
      return;
    setSavingId(application.id);
    const response = await fetch('/api/admin/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: application.id }),
    });
    setSavingId(null);
    if (response.ok) {
      addToast('Application deleted successfully.', 'success');
      setApplications((items) => items.filter((item) => item.id !== application.id));
    } else {
      addToast('Unable to delete this application.', 'error');
    }
  };

  if (authStatus === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (session?.user?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-red-600">Access denied.</div>
    );
  }

  const visibleApplications = selectedService
    ? applications.filter((application) => application.serviceType === selectedService)
    : applications;
  const serviceTitle = selectedService
    ? selectedService.replace(/-/g, ' ')
    : 'Service Applications';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold capitalize text-green-700 dark:text-yellow-400">
              {serviceTitle}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Review citizen details, documents, status, and response remarks.
            </p>
          </div>
          <Link
            href="/admin"
            className="self-start rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700 whitespace-nowrap"
          >
            Back to Admin
          </Link>
        </div>

        {/* Details Section */}
        {selectedApplication && (
          <section className="mb-6 rounded-lg border border-green-200 bg-white p-4 shadow dark:border-green-800 dark:bg-gray-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-green-700">
                  {selectedApplication.applicationNumber} — Citizen Details
                </h2>
                <p className="mt-1 text-xs sm:text-sm capitalize">
                  {selectedApplication.serviceType.replace(/-/g, ' ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="self-start rounded bg-gray-600 px-3 py-1 text-xs sm:text-sm text-white hover:bg-gray-700 whitespace-nowrap"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-sm mb-2">Applicant Information</h3>
                <div className="space-y-1 text-xs sm:text-sm">
                  {Object.entries(selectedApplication.userId || {})
                    .filter(([key]) => !['_id', 'id'].includes(key))
                    .map(([key, value]) => (
                      <p key={key}>
                        <strong className="capitalize">{key}:</strong>{' '}
                        {String(value || '-')}
                      </p>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-2">Submitted Form Details</h3>
                <div className="space-y-1 text-xs sm:text-sm overflow-x-auto">
                  {Object.entries(selectedApplication.formData || {})
                    .filter(([key]) => key !== 'applicant')
                    .map(([key, value]) => (
                      <p key={key}>
                        <strong className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </strong>{' '}
                        {String(value || '-').substring(0, 100)}
                        {String(value || '').length > 100 ? '...' : ''}
                      </p>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Citizen-Uploaded Documents</h3>
                {selectedApplication.documents?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedApplication.documents.map((document, index) => (
                      <a
                        key={`citizen-${index}`}
                        href={document.fileUrl || document.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 break-all hover:underline"
                      >
                        {document.fileName || `Document ${index + 1}`}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">No citizen documents uploaded.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Panchayat-Uploaded Documents</h3>
                {selectedApplication.adminDocuments?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedApplication.adminDocuments.map((document, index) => (
                      <a
                        key={`admin-${index}`}
                        href={document.fileUrl || document.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-green-600 dark:text-green-400 break-all hover:underline"
                      >
                        {document.fileName || `Admin document ${index + 1}`}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">No panchayat documents uploaded.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-3">Application</th>
                <th className="p-3">Service</th>
                <th className="p-3">Applicant</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplications.map((application) => (
                <tr
                  key={application.id}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-3 font-mono text-xs">{application.applicationNumber}</td>
                  <td className="p-3 capitalize text-xs">
                    {application.serviceType.replace(/-/g, ' ')}
                  </td>
                  <td className="p-3 text-xs">{application.userId?.name || 'N/A'}</td>
                  <td className="p-3">
                    <select
                      value={application.status}
                      onChange={(e) => updateLocal(application.id, 'status', e.target.value)}
                      className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-600"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-xs">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => viewDetails(application.id)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 whitespace-nowrap"
                        >
                          View
                        </button>
                        {(application.status === 'Need Documents' || application.status === 'Updated' || application.status === 'Rejected') && <input value={Array.isArray(application.requestedDocuments) ? application.requestedDocuments.join(', ') : ''} onChange={(e) => updateLocal(application.id, 'requestedDocuments', e.target.value)} placeholder="Missing documents" className="w-40 rounded border px-2 py-1 text-xs dark:bg-gray-700" aria-label="Missing documents" />}
                        <button
                          onClick={() => save(application)}
                          disabled={savingId === application.id}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {savingId === application.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => remove(application)}
                          disabled={savingId === application.id}
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Admin docs (1 or more)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,image/png,image/jpeg"
                          onChange={(event) => updateDocuments(application.id, event)}
                          className="block w-full rounded border border-dashed px-2 py-1.5 text-[11px] text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                        />
                        {application.adminDocuments?.length > 0 && (
                          <div className="space-y-1">
                            {application.adminDocuments.map((document, index) => (
                              <a
                                key={`${document.fileName || 'doc'}-${index}`}
                                href={document.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-[11px] text-blue-600 underline dark:text-blue-400"
                              >
                                {document.fileName || `Admin document ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {visibleApplications.map((application) => (
            <div
              key={application.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="font-mono text-xs font-bold">
                      {application.applicationNumber}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {application.serviceType.replace(/-/g, ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(application)}
                    disabled={savingId === application.id}
                    className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>

                <div className="border-t dark:border-gray-700 pt-2 space-y-1 text-xs">
                  <p>
                    <strong>Applicant:</strong> {application.userId?.name || 'N/A'}
                  </p>
                  <p>
                    <strong>Submitted:</strong>{' '}
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Status</label>
                  <select
                    value={application.status}
                    onChange={(e) => updateLocal(application.id, 'status', e.target.value)}
                    className="w-full rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-600"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {(application.status === 'Need Documents' || application.status === 'Updated' || application.status === 'Rejected') && <input value={Array.isArray(application.requestedDocuments) ? application.requestedDocuments.join(', ') : ''} onChange={(e) => updateLocal(application.id, 'requestedDocuments', e.target.value)} placeholder="Missing documents, comma separated" className="w-full rounded border px-2 py-1 text-xs dark:bg-gray-700" aria-label="Missing documents" />}

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Admin docs (1 or more)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(event) => updateDocuments(application.id, event)}
                    className="block w-full rounded border border-dashed px-2 py-1.5 text-[11px] text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  />
                  {application.adminDocuments?.length > 0 && (
                    <div className="space-y-1">
                      {application.adminDocuments.map((document, index) => (
                        <a
                          key={`${document.fileName || 'doc'}-${index}`}
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-[11px] text-blue-600 underline dark:text-blue-400"
                        >
                          {document.fileName || `Admin document ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => viewDetails(application.id)}
                    className="flex-1 rounded bg-blue-600 px-2 py-2 text-xs text-white hover:bg-blue-700 font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => save(application)}
                    disabled={savingId === application.id}
                    className="flex-1 rounded bg-green-600 px-2 py-2 text-xs text-white hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {savingId === application.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {visibleApplications.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No applications found.
          </div>
        )}
        <ToastContainer toasts={toasts} removeToast={removeToast} isDark={true} />
      </div>
    </main>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading service applications...</div>}>
      <AdminApplicationsContent />
    </Suspense>
  );
}
