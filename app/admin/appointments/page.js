"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Rescheduled', 'Cancelled', 'Completed'];

function dateValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function AdminAppointmentsPage() {
  const { data: session, status: authStatus } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50', page: String(page) });
    if (showArchived) params.set('archived', 'true');
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const response = await fetch(`/api/admin/appointments?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setAppointments(data.appointments || []);
      setPagination(data.pagination || { pages: 1, total: 0 });
    } catch (error) {
      setMessage(error.message || 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [page, search, showArchived, statusFilter]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'admin') fetchAppointments();
  }, [authStatus, session?.user?.role, fetchAppointments]);

  const changeLocal = (id, field, value) =>
    setAppointments((rows) =>
      rows.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

  const saveAppointment = async (appointment) => {
    setSavingId(appointment.id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointment.id,
          status: appointment.status,
          adminRemarks: appointment.adminRemarks,
          appointmentDate: dateValue(appointment.appointmentDate),
          appointmentTime: appointment.appointmentTime,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(`Appointment ${appointment.appointmentNumber} updated and the citizen was notified.`);
      fetchAppointments();
    } catch (error) {
      setMessage(error.message || 'Unable to update appointment.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteAppointment = async (appointment) => {
    const confirmed = window.confirm(`Archive appointment ${appointment.appointmentNumber}? It will be hidden from active appointments but kept in history.`);
    if (!confirmed) return;

    setSavingId(appointment.id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appointment.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(`Appointment ${appointment.appointmentNumber} archived successfully.`);
      fetchAppointments();
    } catch (error) {
      setMessage(error.message || 'Unable to delete appointment.');
    } finally {
      setSavingId(null);
    }
  };

  const restoreAppointment = async (appointment) => {
    setSavingId(appointment.id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: appointment.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(`Appointment ${appointment.appointmentNumber} restored successfully.`);
      fetchAppointments();
    } catch (error) {
      setMessage(error.message || 'Unable to restore appointment.');
    } finally {
      setSavingId(null);
    }
  };

  if (authStatus === 'loading') return <div className="p-8 text-center">Loading…</div>;
  if (authStatus === 'unauthenticated' || session?.user?.role !== 'admin') {
    return <div className="min-h-screen p-8 text-center text-red-600">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-yellow-400">Appointment Management</h1>
          <Link href="/admin" className="self-start rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700 whitespace-nowrap">
            Back to Admin
          </Link>
        </div>

        {/* Message */}
        {message && (
          <p
            className={`mb-4 rounded p-3 text-sm ${
              message.includes('Unable')
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
            }`}
          >
            {message}
          </p>
        )}

        {/* Search Filters */}
        <div className="mb-6 grid gap-3 rounded-lg bg-white p-4 shadow dark:bg-gray-800 grid-cols-1 sm:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reference or purpose"
            className="rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAppointments}
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 col-span-1"
          >
            Search
          </button>
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="checkbox" checked={showArchived} onChange={(event) => { setShowArchived(event.target.checked); setPage(1); }} />
            Show archived appointments
          </label>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-3">Reference / Citizen</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Admin Remarks</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-sm">
                    Loading appointments…
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-sm">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-t align-top dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">
                      <p className="font-bold text-green-700">{appointment.appointmentNumber}</p>
                      <p className="text-xs">{appointment.userId?.name || 'Citizen'}</p>
                      <p className="text-xs text-gray-500">
                        {appointment.userId?.phone} ·{' '}
                        {appointment.userId?.email || 'No email'}
                      </p>
                    </td>
                    <td className="p-3 text-xs">{appointment.purpose}</td>
                    <td className="p-3 space-y-1">
                      <input
                        type="date"
                        value={dateValue(appointment.appointmentDate)}
                        onChange={(event) =>
                          changeLocal(appointment.id, 'appointmentDate', event.target.value)
                        }
                        className="w-full rounded border p-1 text-xs dark:bg-gray-700 dark:border-gray-600"
                      />
                      <input
                        type="time"
                        value={appointment.appointmentTime || ''}
                        onChange={(event) =>
                          changeLocal(appointment.id, 'appointmentTime', event.target.value)
                        }
                        className="w-full rounded border p-1 text-xs dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={appointment.status}
                        onChange={(event) =>
                          changeLocal(appointment.id, 'status', event.target.value)
                        }
                        className="rounded border p-1 text-xs dark:bg-gray-700 dark:border-gray-600"
                      >
                        {STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <textarea
                        value={appointment.adminRemarks || ''}
                        onChange={(event) =>
                          changeLocal(appointment.id, 'adminRemarks', event.target.value)
                        }
                        rows="2"
                        className="w-full rounded border p-1 text-xs dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Message for citizen"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col gap-2">
                        {showArchived ? <button onClick={() => restoreAppointment(appointment)} disabled={savingId === appointment.id} className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">Restore</button> : <>
                        <button
                          onClick={() => saveAppointment(appointment)}
                          disabled={savingId === appointment.id}
                          className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {savingId === appointment.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => deleteAppointment(appointment)}
                          disabled={savingId === appointment.id}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          Delete
                        </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="p-8 text-center text-sm">Loading appointments…</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-sm">No appointments found.</div>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="space-y-3">
                  {/* Reference & Citizen */}
                  <div className="border-b pb-2 dark:border-gray-700">
                    <p className="font-bold text-green-700">{appointment.appointmentNumber}</p>
                    <p className="text-xs">{appointment.userId?.name || 'Citizen'}</p>
                    <p className="text-xs text-gray-500 break-all">
                      {appointment.userId?.phone} · {appointment.userId?.email || 'No email'}
                    </p>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="text-xs font-semibold block mb-1">Purpose</label>
                    <p className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {appointment.purpose}
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold block mb-1">Date</label>
                      <input
                        type="date"
                        value={dateValue(appointment.appointmentDate)}
                        onChange={(event) =>
                          changeLocal(appointment.id, 'appointmentDate', event.target.value)
                        }
                        className="w-full rounded border p-2 text-xs dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Time</label>
                      <input
                        type="time"
                        value={appointment.appointmentTime || ''}
                        onChange={(event) =>
                          changeLocal(appointment.id, 'appointmentTime', event.target.value)
                        }
                        className="w-full rounded border p-2 text-xs dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-xs font-semibold block mb-1">Status</label>
                    <select
                      value={appointment.status}
                      onChange={(event) =>
                        changeLocal(appointment.id, 'status', event.target.value)
                      }
                      className="w-full rounded border p-2 text-xs dark:bg-gray-700 dark:border-gray-600"
                    >
                      {STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Admin Remarks */}
                  <div>
                    <label className="text-xs font-semibold block mb-1">Admin Remarks</label>
                    <textarea
                      value={appointment.adminRemarks || ''}
                      onChange={(event) =>
                        changeLocal(appointment.id, 'adminRemarks', event.target.value)
                      }
                      rows="3"
                      className="w-full rounded border p-2 text-xs dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Message for citizen"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {showArchived ? <button onClick={() => restoreAppointment(appointment)} disabled={savingId === appointment.id} className="col-span-2 w-full rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 font-medium">Restore</button> : <>
                    <button
                      onClick={() => saveAppointment(appointment)}
                      disabled={savingId === appointment.id}
                      className="w-full rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {savingId === appointment.id ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => deleteAppointment(appointment)}
                      disabled={savingId === appointment.id}
                      className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      Delete
                    </button>
                    </>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-3 text-sm shadow dark:bg-gray-800">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded border px-3 py-1 disabled:opacity-50">Previous</button>
            <span>Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} disabled={page >= pagination.pages} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
