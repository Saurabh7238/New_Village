'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LEVEL_LABELS,
  PRIORITY_LABELS,
  getPriorityColor,
  getLevelColor,
} from '@/lib/notificationConstants';
import {
  formatDate,
  formatFileSize,
  getIconForFileType,
  isNotificationExpired,
} from '@/lib/notificationDisplay';

export default function NotificationDetailPage() {
  const params = useParams();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchNotification(params.id);
    }
  }, [params.id]);

  const fetchNotification = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications/${id}`);
      const data = await res.json();

      if (data.success) {
        setNotification(data.notification);
      } else {
        setError(data.message || 'Notification not found');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error loading notification');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = (doc) => {
    const link = document.createElement('a');
    link.href = doc.filePath;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Notification Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The notification you are looking for does not exist.'}</p>
            <Link
              href="/notifications"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Back to Notifications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const expired = isNotificationExpired(notification);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/notifications" className="text-blue-600 dark:text-blue-400 hover:underline">
            Notifications
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 dark:text-gray-400 truncate">{notification.title}</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 rounded text-xs font-medium ${getLevelColor(notification.level)}`}>
                {LEVEL_LABELS[notification.level]}
              </span>
              <span className={`px-3 py-1 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                {PRIORITY_LABELS[notification.priority]}
              </span>
              {expired && (
                <span className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  EXPIRED
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-4">
              {notification.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-gray-600 dark:text-gray-400 border-t border-b dark:border-gray-700 py-4">
              <span>
                <strong>Issued:</strong> {formatDate(notification.issueDate)}
              </span>
              {notification.validTill && (
                <span>
                  <strong>Valid Till:</strong> {formatDate(notification.validTill)}
                </span>
              )}
              <span className="ml-auto">
                <strong>Views:</strong> {notification.viewCount || 0}
              </span>
            </div>
          </div>

          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-lg leading-relaxed">
            {notification.description}
          </div>

          {notification.documents && notification.documents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">📎 Attachments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notification.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-3xl">{getIconForFileType(doc.mimeType)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium whitespace-nowrap"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t dark:border-gray-700">
            <Link
              href="/notifications"
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-medium"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
