'use client';

import { useState, useEffect } from 'react';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_LEVELS,
  NOTIFICATION_CATEGORIES,
  TYPE_LABELS,
  LEVEL_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  getLevelColor,
  getCategoryColor,
  getPriorityColor,
} from '@/lib/notificationConstants';
import {
  formatDate,
  formatFileSize,
  getIconForFileType,
  isNotificationExpired,
} from '@/lib/notificationDisplay';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [typeCounts, setTypeCounts] = useState({ message: 0, circular: 0, order: 0 });

  // Filter state
  const [filters, setFilters] = useState({
    type: 'message',
    level: '',
    category: '',
    search: '',
  });

  const itemsPerPage = 10;

  // Fetch notifications when filters or page changes
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('type', filters.type);
        if (filters.level) params.append('level', filters.level);
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        params.append('page', currentPage);
        params.append('limit', itemsPerPage);

        const response = await fetch(`/api/notifications?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          const items = Array.isArray(data.notifications)
            ? data.notifications
            : Array.isArray(data)
              ? data
              : [];

          setNotifications(items);
          setTotalPages(data.pages || 0);
        } else {
          setError('Failed to load notifications');
          setNotifications([]);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Error loading notifications. Please try again.');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const refreshInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(refreshInterval);
  }, [filters, currentPage]);

  useEffect(() => {
    const fetchTypeCounts = async () => {
      try {
        const response = await fetch('/api/notifications?page=1&limit=200');
        const data = await response.json();

        if (!data?.success) return;

        const items = Array.isArray(data.notifications) ? data.notifications : [];
        const counts = { message: 0, circular: 0, order: 0 };

        items.forEach((item) => {
          if (typeof item?.type === 'string' && counts[item.type] !== undefined) {
            counts[item.type] += 1;
          }
        });

        setTypeCounts(counts);
      } catch (error) {
        console.error('Failed to fetch notification counts:', error);
      }
    };

    fetchTypeCounts();
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDownloadDocument = (doc) => {
    const link = document.createElement('a');
    link.href = doc.filePath;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-2">
            Notification Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with important messages, circulars, and orders
          </p>
        </div>

        {/* Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b dark:border-gray-700">
          {NOTIFICATION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() =>
                handleFilterChange('type', type)
              }
              className={`inline-flex items-center gap-2 px-6 py-3 font-medium transition ${
                filters.type === type
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{TYPE_LABELS[type]}</span>
              <span
                className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  filters.type === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {typeCounts[type] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Level</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              >
                <option value="">All Levels</option>
                {NOTIFICATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Filter by Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              >
                <option value="">All Categories</option>
                {NOTIFICATION_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && notifications.length > 0 && (
          <>
            <div className="space-y-4 mb-8">
              {notifications.map((notification) => {
                const expired = isNotificationExpired(notification);
                return (
                  <div
                    key={notification.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
                      expired ? 'border-l-gray-400 opacity-75' : 'border-l-blue-500'
                    }`}
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(notification.level)}`}>
                          {LEVEL_LABELS[notification.level]}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                            notification.category || 'announcement'
                          )}`}
                        >
                          {CATEGORY_LABELS[notification.category || 'announcement']}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {PRIORITY_LABELS[notification.priority]}
                        </span>
                        {expired && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-2">
                        {notification.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Issued:</span> {formatDate(notification.issueDate)}
                        {notification.validTill && (
                          <>
                            {' | '}
                            <span className="font-medium">Valid Till:</span> {formatDate(notification.validTill)}
                          </>
                        )}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {notification.description}
                      </p>
                    </div>

                    {/* Documents */}
                    {notification.documents && notification.documents.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-3">📎 Attachments ({notification.documents.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {notification.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-lg">{getIconForFileType(doc.mimeType)}</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatFileSize(doc.fileSize)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownloadDocument(doc)}
                                className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition whitespace-nowrap"
                              >
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      <span>👁️ {notification.viewCount || 0} views</span>
                      <span>Posted {formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && !error && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {filters.search ? 'No notifications found matching your search.' : 'No notifications available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
