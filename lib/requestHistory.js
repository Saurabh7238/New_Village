export function filterRequestHistory(requests, {
  type = 'all',
  status = 'all',
  search = '',
  dateFrom = '',
  dateTo = '',
} = {}) {
  const normalizedSearch = search.trim().toLowerCase();
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

  return requests.filter(({ item, type: itemType }) => {
    if (type !== 'all' && type !== itemType && type !== item.serviceType) return false;
    if (status !== 'all' && item.status !== status) return false;

    const createdAt = new Date(item.createdAt || item.appointmentDate);
    if (from && (Number.isNaN(createdAt.getTime()) || createdAt < from)) return false;
    if (to && (Number.isNaN(createdAt.getTime()) || createdAt > to)) return false;

    if (!normalizedSearch) return true;
    const searchable = [
      item.applicationNumber,
      item.appointmentNumber,
      item.queryId,
      item.serviceType,
      item.category,
      item.subject,
      item.status,
      item.adminRemarks,
    ].filter(Boolean).join(' ').toLowerCase();
    return searchable.includes(normalizedSearch);
  });
}

export function addStatusHistoryEntry(history, { status, remarks = '', changedBy = 'System', changedAt = new Date() }) {
  const entries = Array.isArray(history) ? history : [];
  const previous = entries.at(-1);
  if (previous?.status === status && previous?.remarks === remarks) return entries;
  return [...entries, { status, remarks, changedBy, changedAt }];
}
