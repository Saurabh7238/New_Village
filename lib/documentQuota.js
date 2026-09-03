export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_USER_DOCUMENT_BYTES = 25 * 1024 * 1024;

export function dataUrlByteLength(value) {
  if (typeof value !== 'string') return 0;
  const comma = value.indexOf(',');
  if (comma < 0) return 0;
  const base64 = value.slice(comma + 1).replace(/\s/g, '');
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
}

export function hasDocumentQuota(existingBytes, newDocuments) {
  const incomingBytes = newDocuments.reduce((total, document) => total + dataUrlByteLength(document.fileUrl), 0);
  return existingBytes + incomingBytes <= MAX_USER_DOCUMENT_BYTES;
}
