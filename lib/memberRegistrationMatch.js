export function normalizeMemberText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function findMemberMatch({ name, fatherName, phone, aadhaarFingerprint, members = [] }) {
  if (!name || !fatherName || !phone) return null;

  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  const normalizedName = normalizeMemberText(name);
  const normalizedFatherName = normalizeMemberText(fatherName);

  return members.find((member) => {
    const memberName = normalizeMemberText(member.fullName);
    const memberFather = normalizeMemberText(member.fatherHusbandName || member.fatherName || '');
    const memberPhone = String(member.mobileNumber || '').replace(/\D/g, '');
    const memberMatchesIdentity =
      memberName === normalizedName &&
      memberFather === normalizedFatherName &&
      memberPhone === normalizedPhone;

    if (memberMatchesIdentity) return true;

    const aadhaarMatches = !!member.aadhaarFingerprint && member.aadhaarFingerprint === aadhaarFingerprint;
    if (aadhaarMatches) return true;

    return false;
  }) || null;
}
