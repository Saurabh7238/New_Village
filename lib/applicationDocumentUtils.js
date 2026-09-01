export function normalizeApplicationsResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.applications)) return payload.applications;
  return [];
}

export function getApplicationId(application) {
  return application?.id || application?._id || application?.applicationId || null;
}

export function normalizeDocument(doc, fallbackName = 'Document') {
  if (!doc) return null;

  const fileName = doc.fileName || doc.filename || fallbackName;
  const fileUrl = doc.fileUrl || doc.url || doc.viewUrl || '';
  const mimeType = doc.mimeType || 'application/octet-stream';
  const uploadedAt = doc.uploadedAt || new Date().toISOString();

  return {
    ...doc,
    fileName,
    fileUrl,
    mimeType,
    uploadedAt,
  };
}

export function getNormalizedDocumentList(application, key = 'documents') {
  if (!application || !Array.isArray(application[key])) return [];
  return application[key].map((doc, index) => normalizeDocument(doc, `${key === 'adminDocuments' ? 'Admin' : 'Citizen'} document ${index + 1}`));
}
