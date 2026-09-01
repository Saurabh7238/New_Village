export const APPLICATION_STATUSES = [
  'Submitted',
  'Under Review',
  'Need Documents',
  'Updated',
  'Approved',
  'Rejected',
  'Completed',
];

export const DOCUMENT_REQUEST_STATUSES = new Set(['Need Documents', 'Updated']);

export function isDocumentRequestStatus(status) {
  return DOCUMENT_REQUEST_STATUSES.has(status);
}

export function getNextStatusAfterCitizenUpload(status) {
  return isDocumentRequestStatus(status) ? 'Updated' : status;
}
