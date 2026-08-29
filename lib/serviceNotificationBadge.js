export function isUnreadServiceNotification(notification) {
  if (!notification || typeof notification !== 'object') return false;
  if (notification.adminResponded == null) return false;
  return notification.isRead !== true;
}

export function buildServiceBadgeCounts(notifications = []) {
  return notifications.reduce((counts, notification) => {
    if (!isUnreadServiceNotification(notification)) return counts;
    const serviceType = notification.serviceType;
    if (!serviceType) return counts;
    counts[serviceType] = (counts[serviceType] || 0) + 1;
    return counts;
  }, {});
}

export function buildRelatedTypeBadgeCounts(notifications = []) {
  return notifications.reduce((counts, notification) => {
    if (!isUnreadServiceNotification(notification)) return counts;
    const relatedType = notification.relatedType;
    if (!relatedType) return counts;
    counts[relatedType] = (counts[relatedType] || 0) + 1;
    return counts;
  }, {});
}
