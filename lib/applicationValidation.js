const REQUIRED_FIELDS = {
  'birth-certificate': ['childName', 'dateOfBirth', 'gender', 'placeOfBirth', 'motherName'],
  'death-certificate': ['applicantAge', 'gender', 'deceasedName', 'dateOfDeath', 'placeOfDeath', 'informantName', 'relationship'],
  'aadhaar-request': ['applicantName', 'applicantMobile'],
  'voter-request': ['applicantName', 'applicantMobile'],
  other: ['applicantName', 'applicantMobile'],
};

export function validateApplicationForm(serviceType, formData) {
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) return 'Application details are required.';
  const missing = (REQUIRED_FIELDS[serviceType] || []).filter((field) => typeof formData[field] !== 'string' || !formData[field].trim());
  if (missing.length) return `Please complete: ${missing.join(', ')}.`;
  const serializedLength = JSON.stringify(formData).length;
  if (serializedLength > 20000) return 'Application details are too large.';
  return null;
}
