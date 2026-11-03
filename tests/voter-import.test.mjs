import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeVoterImport,
  extractVoterRows,
  normalizeVoterImport,
} from "../lib/voterImport.js";

test("normalizes bilingual ward electors and preserves language fields", () => {
  const result = normalizeVoterImport({
    ward_number: 1,
    electors: [{
      serial_number: 12,
      elector_id: "abc123",
      elector_name_en: "Example Name",
      elector_name_hi: "उदाहरण नाम",
      parent_name_en: "Parent Name",
      parent_name_hi: "अभिभावक नाम",
      age: 38,
    }],
  });

  assert.equal(result.totalRows, 1);
  assert.equal(result.voters[0].elector_id, "ABC123");
  assert.equal(result.voters[0].elector_name, "Example Name");
  assert.equal(result.voters[0].elector_name_hi, "उदाहरण नाम");
  assert.equal(result.voters[0].parent_name_en, "Parent Name");
  assert.equal(result.voters[0].parent_name_hi, "अभिभावक नाम");
  assert.equal(result.voters[0].ward, "1");
  assert.equal(result.voters[0].serial_number, "12");
});

test("accepts a top-level voter array and counts duplicate IDs only once", () => {
  const voters = [
    { voterId: "id-1", name: "First", ward: 2 },
    { voterId: "id-1", name: "Duplicate", ward: 2 },
  ];

  assert.equal(extractVoterRows(voters).length, 2);
  const result = normalizeVoterImport(voters);
  assert.equal(result.voters.length, 1);
  assert.equal(result.duplicateRows, 1);
});

test("keeps supporting the older voter field aliases", () => {
  const { voters: [voter] } = normalizeVoterImport({
    voters: [{
      SVN: "legacy-id",
      voter_name: "Legacy Name",
      parentName: "Guardian",
      houseNo: "12A",
      gender: "Female",
      voterAge: 44,
      voter_ward_no: 3,
      relationType: "father",
    }],
  });

  assert.equal(voter.elector_id, "LEGACY-ID");
  assert.equal(voter.elector_name, "Legacy Name");
  assert.equal(voter.parent_name, "Guardian");
  assert.equal(voter.house_no, "12A");
  assert.equal(voter.gender, "Female");
  assert.equal(voter.age, 44);
  assert.equal(voter.ward, "3");
  assert.equal(voter.relation_type, "father");
});

test("preview reports valid, invalid, duplicate, and incomplete rows separately", () => {
  const preview = analyzeVoterImport({
    ward_number: 1,
    electors: [
      { elector_id: "one", elector_name_en: "Valid", age: 0 },
      { elector_id: "ONE", elector_name_hi: "Duplicate", ward_number: 1 },
      { elector_name_en: "Missing ID" },
    ],
  });

  assert.equal(preview.totalRows, 3);
  assert.equal(preview.voters.length, 1);
  assert.equal(preview.duplicateRows, 1);
  assert.deepEqual(preview.invalidRows, [{
    row: 3,
    issues: ["Missing voter ID."],
  }]);
  assert.deepEqual(preview.missingFields, {
    serialNumber: 1,
    houseNumber: 1,
    guardianName: 1,
    gender: 1,
    age: 0,
  });
});

test("rejects records without required IDs, names, or valid ward numbers", () => {
  assert.throws(() => normalizeVoterImport({ electors: [{ ward_number: 1 }] }), /Missing voter ID/);
  assert.throws(() => normalizeVoterImport({
    electors: [{ elector_id: "id-1", elector_name_en: "Name" }],
  }), /Ward must be a number/);
  assert.throws(() => extractVoterRows({ records: [] }), /electors or voters array/);
});
