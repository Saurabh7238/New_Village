export function parseVoterListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.voters && Array.isArray(data.voters)) return data.voters;
  return [];
}

export function getVoterName(voter) {
  return voter.voterName || voter.name || voter.elector_name || "Unnamed Voter";
}

export function getVoterId(voter) {
  return voter.voterId || "";
}

export function getVoterGuardian(voter) {
  return (
    voter.voterGuardianName ||
    voter.guardian_name ||
    voter.guardian ||
    voter.parent_spouse_name ||
    ""
  );
}

export function getVoterGender(voter) {
  return voter.voterGender || voter.gender || "";
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
