const MAX_IMPORT_ROWS = 5000;

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}

export function extractVoterRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.electors)) return payload.electors;
  if (Array.isArray(payload?.voters)) return payload.voters;
  throw new Error('JSON must contain an electors or voters array.');
}

export function analyzeVoterImport(payload, { defaultWard } = {}) {
  let rows;
  try {
    rows = extractVoterRows(payload);
  } catch (error) {
    return {
      voters: [],
      totalRows: 0,
      invalidRows: [{ row: 0, issues: [error.message] }],
      duplicateRows: 0,
      missingFields: {},
    };
  }

  const payloadWard = defaultWard ?? payload?.ward_number;
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      voters: [],
      totalRows: rows.length,
      invalidRows: [{ row: 0, issues: [`Import up to ${MAX_IMPORT_ROWS} voters at a time.`] }],
      duplicateRows: 0,
      missingFields: {},
    };
  }

  const normalized = [];
  const seenIds = new Set();
  const invalidRows = [];
  const missingFields = {
    serialNumber: 0,
    houseNumber: 0,
    guardianName: 0,
    gender: 0,
    age: 0,
  };
  let duplicateRows = 0;

  rows.forEach((voter, index) => {
    if (!voter || typeof voter !== 'object' || Array.isArray(voter)) {
      invalidRows.push({ row: index + 1, issues: ['Row must be a voter object.'] });
      return;
    }

    const electorId = String(firstValue(
      voter.elector_id,
      voter.electorId,
      voter.voter_id,
      voter.voterId,
      voter["EPIC No."],
      voter.SVN,
      voter.svn_no,
      voter.svnNo,
    ) || '').trim().toUpperCase();
    const nameEn = String(firstValue(
      voter.elector_name_en,
      voter.elector_name,
      voter.voter_name,
      voter.voterName,
      voter.name,
    ) || '').trim();
    const nameHi = String(firstValue(voter.elector_name_hi, voter.name_hi) || '').trim();
    const wardRaw = firstValue(
      voter.ward_number,
      voter.voterWardNo,
      voter.voter_ward_no,
      voter.ward_no,
      voter.ward,
      voter.Ward,
      payloadWard,
    );
    const wardNumber = Number(wardRaw);
    const ageRaw = firstValue(voter.age, voter.voterAge);
    const age = ageRaw === undefined ? undefined : Number(ageRaw);
    const issues = [];
    if (!electorId) issues.push('Missing voter ID.');
    if (!nameEn && !nameHi) issues.push('Missing English and Hindi name.');
    if (!Number.isInteger(wardNumber) || wardNumber < 1 || wardNumber > 20) {
      issues.push('Ward must be a number from 1 to 20.');
    }
    if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 130)) {
      issues.push('Age must be a number from 0 to 130.');
    }
    if (issues.length) {
      invalidRows.push({ row: index + 1, issues });
      return;
    }

    if (seenIds.has(electorId)) {
      duplicateRows += 1;
      return;
    }
    seenIds.add(electorId);

    const serialNumber = firstValue(
      voter.serial_number,
      voter.serialNumber,
      voter.serial_no,
      voter["Serial No."],
      voter["Serial Number"],
    );
    const parentNameEn = String(firstValue(
      voter.parent_name_en,
      voter.parent_name,
      voter.parentName,
      voter.guardian_name,
      voter.voterGuardianName,
      voter.relationship_name,
      voter.relation_name,
    ) || '').trim();
    const parentNameHi = String(firstValue(voter.parent_name_hi, voter.guardian_name_hi) || '').trim();
    const houseNumber = firstValue(voter.house_no, voter.houseNo, voter.house_number);
    const svnNumber = firstValue(voter.SVN, voter.Svn, voter.svn, voter.svn_no, voter.svnNo);
    const gender = firstValue(voter.gender, voter.voterGender, voter.Gender);
    const relationship = firstValue(
      voter.relationship,
      voter.relation,
      voter.relation_name,
      voter["Relation's Name"],
      voter.parent_spouse_name,
    );
    const relationType = firstValue(
      voter.relation_type,
      voter.relationType,
      voter.relationTypeName,
      voter.relation_type_name,
    );
    const displayName = nameEn || nameHi;
    const displayParentName = parentNameEn || parentNameHi;
    if (!hasValue(serialNumber)) missingFields.serialNumber += 1;
    if (!hasValue(houseNumber)) missingFields.houseNumber += 1;
    if (!displayParentName) missingFields.guardianName += 1;
    if (!hasValue(gender)) missingFields.gender += 1;
    if (age === undefined) missingFields.age += 1;
    normalized.push({
      type: 'gram-panchayat',
      serial_number: serialNumber === undefined ? String(index + 1) : String(serialNumber).trim(),
      ward: String(wardNumber),
      voterWardNo: String(wardNumber),
      elector_id: electorId,
      voterId: electorId,
      elector_name: displayName,
      voterName: displayName,
      name: displayName,
      ...(nameEn ? { elector_name_en: nameEn } : {}),
      ...(nameHi ? { elector_name_hi: nameHi } : {}),
      ...(displayParentName ? {
        parent_name: displayParentName,
        voterGuardianName: displayParentName,
      } : {}),
      ...(parentNameEn ? { parent_name_en: parentNameEn } : {}),
      ...(parentNameHi ? { parent_name_hi: parentNameHi } : {}),
      ...(houseNumber === undefined ? {} : { house_no: String(houseNumber).trim() }),
      ...(svnNumber === undefined ? {} : { svn_no: String(svnNumber).trim() }),
      ...(gender === undefined ? {} : {
        gender: String(gender).trim(),
        voterGender: String(gender).trim(),
      }),
      ...(relationship === undefined ? {} : { relationship: String(relationship).trim() }),
      ...(relationType === undefined ? {} : { relation_type: String(relationType).trim() }),
      ...(age === undefined ? {} : { age, voterAge: age }),
    });
  });

  return { voters: normalized, duplicateRows, totalRows: rows.length, invalidRows, missingFields };
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function normalizeVoterImport(payload, options) {
  const result = analyzeVoterImport(payload, options);
  if (result.invalidRows.length) {
    const firstIssue = result.invalidRows[0].issues[0];
    throw new Error(result.invalidRows[0].row
      ? `Row ${result.invalidRows[0].row}: ${firstIssue}`
      : firstIssue);
  }
  if (result.totalRows === 0) throw new Error('The selected JSON contains no voter records.');
  if (!result.voters.length) throw new Error('The selected JSON contains no valid unique voter records.');
  return result;
}
