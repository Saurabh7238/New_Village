'use client';

import { withLocalizedPage } from "@/app/localized-page";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/language-provider';
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

function NotificationsPage() {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const labels = isHindi
    ? {
      title: 'सूचना बोर्ड',
      subtitle: 'महत्वपूर्ण संदेशों, परिपत्रों और आदेशों से अपडेट रहें',
      message: 'संदेश', circular: 'परिपत्र', order: 'आदेश',
      national: 'राष्ट्रीय', state: 'राज्य', zila_panchayat: 'जिला पंचायत',
      announcement: 'घोषणा', urgent: 'अत्यावश्यक', update: 'अपडेट', legal: 'कानूनी सूचना',
      administrative: 'प्रशासनिक', public_notice: 'सार्वजनिक सूचना',
      birthday: 'जन्मदिन की शुभकामनाएं', greeting: 'शुभकामनाएं',
      congratulations: 'बधाई', condolence: 'शोक संदेश', community_event: 'सामुदायिक कार्यक्रम',
      low: 'कम', medium: 'मध्यम', high: 'उच्च',
      filterLevel: 'स्तर के अनुसार फ़िल्टर करें', allLevels: 'सभी स्तर',
      filterCategory: 'श्रेणी के अनुसार फ़िल्टर करें', allCategories: 'सभी श्रेणियां',
      search: 'खोजें', searchPlaceholder: 'शीर्षक से खोजें...',
      loading: 'सूचनाएं लोड हो रही हैं...', failed: 'सूचनाएं लोड करने में विफल',
      error: 'सूचनाएं लोड करने में त्रुटि। कृपया पुनः प्रयास करें।',
      expired: 'समाप्त', view: 'देखें', issued: 'जारी किया गया:',
      validTill: 'मान्य तिथि:', attachments: 'संलग्नक', download: 'डाउनलोड',
      views: 'दृश्य', posted: 'प्रकाशित',
      previous: 'पिछला', next: 'अगला',
      noMatches: 'आपकी खोज से मेल खाने वाली कोई सूचना नहीं मिली।',
      none: 'अभी कोई सूचना उपलब्ध नहीं है.',
    }
    : {
      title: 'Notification Board',
      subtitle: 'Stay updated with important messages, circulars, and orders',
      message: TYPE_LABELS.message, circular: TYPE_LABELS.circular, order: TYPE_LABELS.order,
      national: LEVEL_LABELS.national, state: LEVEL_LABELS.state, zila_panchayat: LEVEL_LABELS.zila_panchayat,
      announcement: CATEGORY_LABELS.announcement, urgent: CATEGORY_LABELS.urgent, update: CATEGORY_LABELS.update,
      legal: CATEGORY_LABELS.legal, administrative: CATEGORY_LABELS.administrative,
      public_notice: CATEGORY_LABELS.public_notice, birthday: CATEGORY_LABELS.birthday,
      greeting: CATEGORY_LABELS.greeting, congratulations: CATEGORY_LABELS.congratulations,
      condolence: CATEGORY_LABELS.condolence, community_event: CATEGORY_LABELS.community_event,
      low: PRIORITY_LABELS.low, medium: PRIORITY_LABELS.medium, high: PRIORITY_LABELS.high,
      filterLevel: 'Filter by Level', allLevels: 'All Levels',
      filterCategory: 'Filter by Category', allCategories: 'All Categories',
      search: 'Search', searchPlaceholder: 'Search by title...',
      loading: 'Loading notifications...', failed: 'Failed to load notifications',
      error: 'Error loading notifications. Please try again.',
      expired: 'EXPIRED', view: 'View', issued: 'Issued:',
      validTill: 'Valid Till:', attachments: 'Attachments', download: 'Download',
      views: 'views', posted: 'Posted',
      previous: 'Previous', next: 'Next',
      noMatches: 'No notifications found matching your search.',
      none: 'No notifications available at the moment.',
    };
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [typeCounts, setTypeCounts] = useState({ message: 0, circular: 0, order: 0 });

  // Filter state
  const [filters, setFilters] = useState({
    type: '',
    level: '',
    category: '',
    search: '',
  });

  const itemsPerPage = 10;

  // Fetch notifications when filters or page changes
  useEffect(() => {
    const fetchNotifications = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
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
          setError(labels.failed);
          setNotifications([]);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(labels.error);
        setNotifications([]);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchNotifications(true);

    const refreshInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(refreshInterval);
  }, [filters, currentPage, labels.error, labels.failed]);

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
    const countInterval = setInterval(fetchTypeCounts, 30000);
    return () => clearInterval(countInterval);
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
            {labels.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {labels.subtitle}
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
              <span>{labels[type]}</span>
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
              <label className="block text-sm font-medium mb-2">{labels.filterLevel}</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              >
                <option value="">{labels.allLevels}</option>
                {NOTIFICATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {labels[level]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{labels.filterCategory}</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              >
                <option value="">{labels.allCategories}</option>
                {NOTIFICATION_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {labels[category]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{labels.search}</label>
              <input
                type="text"
                placeholder={labels.searchPlaceholder}
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
            <p className="text-gray-500 dark:text-gray-400">{labels.loading}</p>
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
                    style={{
                      backgroundColor: notification.backgroundColor || '#ffffff',
                      color: notification.fontColor || '#1f2937',
                    }}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
                      expired ? 'border-l-gray-400 opacity-75' : 'border-l-blue-500'
                    }`}
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(notification.level)}`}>
                          {labels[notification.level]}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                            notification.category || 'announcement'
                          )}`}
                        >
                          {labels[notification.category || 'announcement']}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {labels[notification.priority]}
                        </span>
                        {expired && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {labels.expired}
                          </span>
                        )}
                      </div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <h2
                          className="text-2xl font-bold"
                          style={{ color: notification.fontColor || '#1f2937' }}
                        >
                          {notification.title}
                        </h2>
                        <Link href={`/notifications/${notification.id}`} className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                          {labels.view}
                        </Link>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{labels.issued}</span> {formatDate(notification.issueDate)}
                        {notification.validTill && (
                          <>
                            {' | '}
                            <span className="font-medium">{labels.validTill}</span> {formatDate(notification.validTill)}
                          </>
                        )}
                      </p>
                    </div>

                    {/* Description */}
                    <div
                      className="mb-4 rounded p-4"
                      style={{
                        backgroundColor: notification.backgroundColor || '#ffffff',
                        color: notification.fontColor || '#1f2937',
                      }}
                    >
                      <p className="whitespace-pre-wrap">
                        {notification.description}
                      </p>
                    </div>

                    {/* Documents */}
                    {notification.documents && notification.documents.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-3">📎 {labels.attachments} ({notification.documents.length})</h3>
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
                                {labels.download}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      <span>👁️ {notification.viewCount || 0} {labels.views}</span>
                      <span>{labels.posted} {formatDate(notification.createdAt)}</span>
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
                  {labels.previous}
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
                  {labels.next}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && !error && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {filters.search ? labels.noMatches : labels.none}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default withLocalizedPage(NotificationsPage);
