import { TYPE_LABELS, LEVEL_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/notificationConstants';

export function getTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

export function getLevelLabel(level) {
  return LEVEL_LABELS[level] || level;
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function getPriorityLabel(priority) {
  return PRIORITY_LABELS[priority] || priority;
}

export function isNotificationExpired(notification) {
  if (!notification.validTill) return false;
  return new Date(notification.validTill) < new Date();
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFileExtension(fileName) {
  return fileName.split('.').pop().toLowerCase();
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function getIconForFileType(mimeType) {
  const icons = {
    'application/pdf': '📄',
    'application/msword': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
  };
  return icons[mimeType] || '📎';
}
