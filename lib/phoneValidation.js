const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return null;
}

export function isValidIndianMobile(phone) {
  const normalized = normalizePhone(phone);
  return normalized !== null && INDIAN_MOBILE_REGEX.test(normalized);
}
