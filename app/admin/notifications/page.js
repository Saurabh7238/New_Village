'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_LEVELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUS,
  NOTIFICATION_CATEGORIES,
  GREETING_CATEGORIES,
  TYPE_LABELS,
  LEVEL_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  CATEGORY_LABELS,
  getStatusColor,
  getLevelColor,
  getCategoryColor,
} from '@/lib/notificationConstants';
import {
  getTypeLabel,
  getLevelLabel,
  getStatusLabel,
  formatDate,
  formatDateTime,
  formatFileSize,
  getIconForFileType,
} from '@/lib/notificationDisplay';

function toLocalDateTimeInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function AdminNoticeSection({ title, description, notices, loading, onCreate, onEdit, onDelete }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
      <header className="flex flex-col gap-3 border-b border-gray-200 p-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          + Create {title === 'Official Announcements' ? 'Announcement' : 'Greeting'}
        </button>
      </header>

      {loading ? (
        <p role="status" className="p-8 text-center text-gray-500">Loading notices...</p>
      ) : notices.length === 0 ? (
        <p className="p-8 text-center text-gray-500">No {title.toLowerCase()} found.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left font-semibold">Title</th>
                  <th className="p-3 text-left font-semibold">Type</th>
                  <th className="p-3 text-left font-semibold">Level</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Category</th>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="max-w-xs truncate p-3">{notice.title}</td>
                    <td className="p-3">{getTypeLabel(notice.type)}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${getLevelColor(notice.level)}`}>
                        {getLevelLabel(notice.level)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(notice.status)}`}>
                        {getStatusLabel(notice.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${getCategoryColor(notice.category)}`}>
                        {CATEGORY_LABELS[notice.category] || CATEGORY_LABELS.announcement}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {notice.scheduledPublishDate && notice.status === 'scheduled' ? (
                        <span>
                          Scheduled
                          <span className="block text-xs text-gray-500">{formatDateTime(notice.scheduledPublishDate)}</span>
                        </span>
                      ) : formatDate(notice.issueDate)}
                    </td>
                    <td className="space-x-2 p-3">
                      <Link href={`/notifications/${notice.id}`} className="text-sm font-medium text-green-600 hover:text-green-800">
                        View
                      </Link>
                      <button type="button" onClick={() => onEdit(notice)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        Edit
                      </button>
                      <button type="button" onClick={() => onDelete(notice.id)} className="text-sm font-medium text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {notices.map((notice) => (
              <article key={notice.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700">
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-bold text-green-700 dark:text-green-400">{notice.title}</p>
                    <p className="text-gray-600 dark:text-gray-400">{getTypeLabel(notice.type)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-gray-300 pt-2 dark:border-gray-600">
                    <p><strong>Level:</strong> {getLevelLabel(notice.level)}</p>
                    <p><strong>Status:</strong> {getStatusLabel(notice.status)}</p>
                    <p><strong>Category:</strong> {CATEGORY_LABELS[notice.category] || CATEGORY_LABELS.announcement}</p>
                    <p>
                      <strong>{notice.scheduledPublishDate && notice.status === 'scheduled' ? 'Scheduled:' : 'Date:'}</strong>{' '}
                      {notice.scheduledPublishDate && notice.status === 'scheduled'
                        ? formatDateTime(notice.scheduledPublishDate)
                        : formatDate(notice.issueDate)}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/notifications/${notice.id}`} className="flex-1 rounded bg-green-600 px-2 py-2 text-center font-medium text-white hover:bg-green-700">
                      View
                    </Link>
                    <button type="button" onClick={() => onEdit(notice)} className="flex-1 rounded bg-blue-600 px-2 py-2 font-medium text-white hover:bg-blue-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => onDelete(notice.id)} className="flex-1 rounded bg-red-600 px-2 py-2 font-medium text-white hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Form state
  const [formData, setFormData] = useState({
    type: 'message',
    level: 'national',
    title: '',
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    validTill: '',
    priority: 'medium',
    status: 'published',
    category: 'announcement',
    scheduledPublishDate: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    type: '',
    level: '',
    status: '',
    search: '',
    category: '',
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated' || session?.user?.role !== 'admin') return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '200');
      if (filters.type) params.append('type', filters.type);
      if (filters.level) params.append('level', filters.level);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        showMessage('Failed to fetch notifications', 'error');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showMessage('Error fetching notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, session?.user?.role, status]);

  useEffect(() => {
    fetchNotifications();
    const refreshInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchNotifications]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files && e.target.files.length > 0 ? Array.from(e.target.files) : null);
  };

  const uploadFiles = async (notificationId) => {
    if (!selectedFile || selectedFile.length === 0) return;

    try {
      const formDataToSend = new FormData();
      selectedFile.forEach((file) => {
        formDataToSend.append('files', file);
      });

      const res = await fetch(`/api/notifications/${notificationId}/documents`, {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await res.json();

      if (data.success) {
        showMessage(`${data.documents.length} file(s) uploaded successfully`, 'success');
        setSelectedFile(null);
        setUploadedFiles(data.documents || []);
      } else {
        showMessage(data.message || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('Error uploading files', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedTitle = (formData.title || '').trim();
      const trimmedDescription = (formData.description || '').trim();

      if (!trimmedTitle || !trimmedDescription) {
        showMessage('Title and description are required', 'error');
        setLoading(false);
        return;
      }

      if (trimmedTitle.length > 200) {
        showMessage('Title cannot exceed 200 characters', 'error');
        setLoading(false);
        return;
      }

      if (trimmedDescription.length < 10) {
        showMessage('Description must be at least 10 characters', 'error');
        setLoading(false);
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/api/notifications?id=${editingId}` : '/api/notifications';

      const payload = {
        ...formData,
        type: GREETING_CATEGORIES.includes(formData.category) ? 'message' : formData.type,
        title: trimmedTitle,
        description: trimmedDescription,
        validTill: formData.validTill
          ? new Date(`${formData.validTill}T23:59:59.999`).toISOString()
          : null,
        scheduledPublishDate: formData.scheduledPublishDate
          ? new Date(formData.scheduledPublishDate).toISOString()
          : null,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || `Failed to ${editingId ? 'update' : 'create'} notification`, 'error');
        setLoading(false);
        return;
      }

      // Upload files if any
      if (selectedFile && selectedFile.length > 0) {
        await uploadFiles(data.notification.id);
      }

      showMessage(data.message || `Notification ${editingId ? 'updated' : 'created'} successfully`, 'success');
      resetForm();
      setShowForm(false);
      fetchNotifications();
    } catch (error) {
      console.error('Submit error:', error);
      showMessage('Error saving notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notification) => {
    setFormData({
      type: notification.type,
      level: notification.level,
      title: notification.title,
      description: notification.description,
      issueDate: notification.issueDate.split('T')[0],
      validTill: notification.validTill ? notification.validTill.split('T')[0] : '',
      priority: notification.priority,
      status: notification.status,
      category: notification.category || 'announcement',
      scheduledPublishDate: notification.scheduledPublishDate
        ? toLocalDateTimeInput(notification.scheduledPublishDate)
        : '',
    });
    setUploadedFiles(notification.documents || []);
    setEditingId(notification.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification and all its documents?')) {
      return;
    }

    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        showMessage('Notification deleted successfully', 'success');
        fetchNotifications();
      } else {
        showMessage(data.message || 'Failed to delete notification', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('Error deleting notification', 'error');
    }
  };

  const handleDeleteDocument = async (notificationId, docId) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/documents?docId=${docId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        showMessage('Document deleted', 'success');
        setUploadedFiles((prev) => prev.filter((doc) => doc.id !== docId));
      } else {
        showMessage(data.message || 'Failed to delete document', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('Error deleting document', 'error');
    }
  };

  const resetForm = (category = 'announcement') => {
    setFormData({
      type: 'message',
      level: 'national',
      title: '',
      description: '',
      issueDate: new Date().toISOString().split('T')[0],
      validTill: '',
      priority: 'medium',
      status: 'published',
      category,
      scheduledPublishDate: '',
    });
    setEditingId(null);
    setUploadedFiles([]);
    setSelectedFile(null);
  };

  const openCreateForm = (category) => {
    resetForm(category);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth protection
  if (status === 'loading') return <div className="p-8 text-center">Loading...</div>;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Access Denied. Admin access required.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-700 dark:text-blue-400">
            Community Notice Board Manager
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/?logout=true" })}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              messageType === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {editingId ? 'Edit Notification' : 'Create New Notification'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Publish birthday wishes, greetings, congratulations, condolence messages, community events, and official notices.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Official announcement types do not apply to community greetings. */}
              {!GREETING_CATEGORIES.includes(formData.category) && <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={!!editingId}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                >
                  {NOTIFICATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>}

              {/* Level */}
              <div>
                <label className="block text-sm font-medium mb-2">Level *</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                >
                  {NOTIFICATION_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title (max 200 chars) *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={200}
                  placeholder="Enter notification title"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200</p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter notification description"
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  required
                />
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Issue Date</label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
              </div>

              {/* Valid Till */}
              <div>
                <label className="block text-sm font-medium mb-2">Remove from public board after (Optional)</label>
                <input
                  type="date"
                  name="validTill"
                  value={formData.validTill}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The notice disappears from the public board at the end of this date and is archived for admins; it is not permanently deleted.
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                >
                  {NOTIFICATION_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                >
                  {NOTIFICATION_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Notice Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    const category = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      category,
                      ...(GREETING_CATEGORIES.includes(category) ? { type: 'message' } : {}),
                    }));
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                >
                  {NOTIFICATION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Publish Date */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Schedule Publish Date (Optional)</label>
                <input
                  type="datetime-local"
                  name="scheduledPublishDate"
                  value={formData.scheduledPublishDate}
                  onChange={(e) => {
                    const scheduledPublishDate = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      scheduledPublishDate,
                      status: scheduledPublishDate
                        ? 'scheduled'
                        : prev.status === 'scheduled'
                          ? 'published'
                          : prev.status,
                    }));
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a future date and time to publish automatically. Leave empty to publish immediately (or keep as a draft).
                </p>
              </div>

              {/* File Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Upload Documents (PDF, DOC, JPG, PNG - Max 10MB each)</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium mb-2">Uploaded Documents:</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span>{getIconForFileType(doc.mimeType)}</span>
                          <div>
                            <p className="text-sm font-medium">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(editingId || 'new', doc.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update Notification' : 'Create Notification'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by title..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            >
              <option value="">All Types</option>
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={filters.level}
              onChange={(e) => setFilters((prev) => ({ ...prev, level: e.target.value }))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            >
              <option value="">All Levels</option>
              {NOTIFICATION_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            >
              <option value="">All Statuses</option>
              {NOTIFICATION_STATUS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            >
              <option value="">All Categories</option>
              {NOTIFICATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <AdminNoticeSection
            title="Official Announcements"
            description="Manage messages, circulars, orders, public notices, and other official updates."
            notices={notifications.filter((notice) => !GREETING_CATEGORIES.includes(notice.category))}
            loading={loading}
            onCreate={() => openCreateForm('announcement')}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <AdminNoticeSection
            title="Greetings & Community Messages"
            description="Manage birthday wishes, greetings, congratulations, and condolence notices."
            notices={notifications.filter((notice) => GREETING_CATEGORIES.includes(notice.category))}
            loading={loading}
            onCreate={() => openCreateForm('greeting')}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
