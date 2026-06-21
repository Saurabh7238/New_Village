'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_LEVELS,
  NOTIFICATION_CATEGORIES,
  TYPE_LABELS,
  LEVEL_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  getStatusColor,
  getPriorityColor,
  getLevelColor,
  getCategoryColor,
  isExpired,
} from '@/lib/notificationConstants';
import {
  getTypeLabel,
  getLevelLabel,
  formatDate,
  formatFileSize,
  getIconForFileType,
  isNotificationExpired,
} from '@/lib/notificationDisplay';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [selectedType, setSelectedType] = useState('message');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, [selectedType, selectedLevel, selectedCategory, searchTerm]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('type', selectedType);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  const handleDownloadDocument = (doc) => {
    // Create a temporary link and trigger download
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-2">
            Notification Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with important messages, circulars, and orders
          </p>
        </div>

        {/* Tabs for Notification Types */}
        <div className="flex flex-wrap gap-2 mb-8 border-b dark:border-gray-700">
          {NOTIFICATION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setSelectedLevel('');
              }}
              className={`px-6 py-3 font-medium transition ${
                selectedType === type
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Level Filter & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
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
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Found {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && paginatedNotifications.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedNotifications.map((notification) => {
                const expired = isNotificationExpired(notification);
                return (
                  <div
                    key={notification.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
                      expired ? 'border-l-gray-400 opacity-75' : 'border-l-blue-500'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(notification.level)}`}>
                            {LEVEL_LABELS[notification.level]}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(notification.category || 'announcement')}`}>
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
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
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
        ) : (
          !loading && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm
                  ? 'No notifications found matching your search.'
                  : `No ${TYPE_LABELS[selectedType]?.toLowerCase() || 'notifications'} available.`}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
