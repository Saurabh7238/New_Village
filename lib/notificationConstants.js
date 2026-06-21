export const NOTIFICATION_TYPES = ['message', 'circular', 'order'];
export const NOTIFICATION_LEVELS = ['national', 'state', 'zila_panchayat'];
export const NOTIFICATION_PRIORITIES = ['low', 'medium', 'high'];
export const NOTIFICATION_STATUS = ['draft', 'published', 'archived'];

export const TYPE_LABELS = {
  message: 'Message',
  circular: 'Circular',
  order: 'Order',
};

export const LEVEL_LABELS = {
  national: 'National',
  state: 'State',
  zila_panchayat: 'Zila Panchayat',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

export const NOTIFICATION_CATEGORIES = ['announcement', 'urgent', 'update', 'legal', 'administrative', 'public_notice'];

export const CATEGORY_LABELS = {
  announcement: 'Announcement',
  urgent: 'Urgent',
  update: 'Update',
  legal: 'Legal Notice',
  administrative: 'Administrative',
  public_notice: 'Public Notice',
};

export function getStatusColor(status) {
  const colors = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  return colors[status] || colors.draft;
}

export function getPriorityColor(priority) {
  const colors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[priority] || colors.low;
}

export function getLevelColor(level) {
  const colors = {
    national: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    state: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    zila_panchayat: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  };
  return colors[level] || colors.national;
}

export function getCategoryColor(category) {
  const colors = {
    announcement: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    update: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    legal: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    administrative: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    public_notice: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  };
  return colors[category] || colors.announcement;
}

export function isExpired(validTill) {
  if (!validTill) return false;
  return new Date(validTill) < new Date();
}
