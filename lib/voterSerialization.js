export function serializeVoter(item, fallbackType) {
  const plain = item.toObject();
  const id = plain._id.toString();

  const serialNumber = plain.serialNumber || plain.serial_number || "";
  const houseNo = plain.houseNo || plain.house_no || "";
  const svnNo = plain.svnNo || plain.svn_no || plain.voterId || "";
  const electorName = plain.electorName || plain.elector_name || plain.name || "";
  const relationType = plain.relationType || plain.relation_type || "";
  const relationship = plain.relationship || plain.parent_name || plain.voterGuardianName || "";
  const voterGender = plain.voterGender || plain.gender || "";
  const voterAge = plain.voterAge ?? plain.age ?? undefined;
  const voterWardNo = plain.voterWardNo || plain.ward || plain.house_no || "";
  const voterConstituency = plain.voterConstituency || plain.constituency || "";

  return {
    ...plain,
    type: plain.type || fallbackType,
    serialNumber,
    serial_number: serialNumber,
    houseNo,
    house_no: houseNo,
    svnNo,
    svn_no: svnNo,
    electorName,
    elector_name: electorName,
    relationType,
    relation_type: relationType,
    relationship,
    parent_name: plain.parent_name || relationship,
    voterId: plain.voterId || plain.elector_id || svnNo,
    voterName: plain.voterName || electorName,
    voterGuardianName: plain.voterGuardianName || relationship,
    voterGender,
    gender: voterGender,
    voterAge,
    age: voterAge,
    voterWardNo,
    ward: plain.ward || voterWardNo,
    voterConstituency,
    constituency: plain.constituency || voterConstituency,
    id,
    _id: id,
  };
}