export function canDeleteUploadedDocument(document, currentUserId) {
  if (!document || !currentUserId) return false;
  return document.uploadedBy === 'citizen' && String(document.userId || document.ownerId || '') === String(currentUserId);
}
