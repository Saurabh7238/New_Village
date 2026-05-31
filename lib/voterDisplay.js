export function parseVoterListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.voters && Array.isArray(data.voters)) return data.voters;
  return [];
}

export function getVoterName(voter) {
  return (
    voter.voterName ||
    voter.name ||
    voter.Name ||
    voter.elector_name ||
    "Unnamed Voter"
  );
}

export function getVoterId(voter) {
  return voter.voterId || voter["EPIC No."] || "";
}

export function getVoterGuardian(voter) {
  return (
    voter.voterGuardianName ||
    voter.guardian_name ||
    voter.guardian ||
    voter.parent_spouse_name ||
    voter["Relation's Name"] ||
    ""
  );
}

export function getVoterGender(voter) {
  return voter.voterGender || voter.gender || voter.Gender || "";
}

export function getVoterAge(voter) {
  const raw = voter.age ?? voter.Age ?? voter.voterAge;
  if (raw === "" || raw === null || raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function classifyVoterGender(voter) {
  const value = String(getVoterGender(voter)).trim().toLowerCase();
  if (!value) return "other";

  if (
    value === "male" ||
    value === "m" ||
    value === "पु" ||
    value.startsWith("पुरु") ||
    value.includes("purush")
  ) {
    return "male";
  }

  if (
    value === "female" ||
    value === "f" ||
    value === "म" ||
    value.startsWith("महि") ||
    value.includes("mahila")
  ) {
    return "female";
  }

  return "other";
}

export function getVoterConstituency(voter) {
  return voter.voterConstituency || voter.constituency || "";
}

export function getVoterWard(voter) {
  return voter.voterWardNo || voter.ward || voter.house_number || "";
}

export function getVoterImage(voter) {
  return voter.image || voter.image_data || "";
}

export function getGalleryImageSrc(image) {
  return image?.image_data || image?.url || "";
}
