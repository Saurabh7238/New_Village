import test from "node:test";
import assert from "node:assert/strict";

import { serializeVoter } from "../lib/voterSerialization.js";
import {
  getVoterName,
  getVoterId,
  getVoterGuardian,
  getVoterGender,
  getVoterAge,
  getVoterWard,
  getVoterHouseNo,
  getVoterSerialNumber,
  getVoterRelationship,
  getVoterSvnNo,
  getVoterRelationType,
} from "../lib/voterDisplay.js";

test("serializeVoter returns canonical fields plus legacy aliases", () => {
  const voter = serializeVoter(
    {
      toObject: () => ({
        _id: { toString: () => "507f1f77bcf86cd799439011" },
        type: "gram-panchayat",
        serial_number: "12",
        house_no: "A-5",
        svn_no: "SVN-44",
        elector_name: "Maya Devi",
        relation_type: "D/O",
        parent_name: "Ramesh Kumar",
        gender: "Female",
        age: 41,
        ward: "7",
      }),
    },
    "gram-panchayat"
  );

  assert.equal(voter.id, "507f1f77bcf86cd799439011");
  assert.equal(voter._id, "507f1f77bcf86cd799439011");
  assert.equal(voter.serialNumber, "12");
  assert.equal(voter.serial_number, "12");
  assert.equal(voter.houseNo, "A-5");
  assert.equal(voter.house_no, "A-5");
  assert.equal(voter.svnNo, "SVN-44");
  assert.equal(voter.svn_no, "SVN-44");
  assert.equal(voter.electorName, "Maya Devi");
  assert.equal(voter.elector_name, "Maya Devi");
  assert.equal(voter.relationType, "D/O");
  assert.equal(voter.relation_type, "D/O");
  assert.equal(voter.relationship, "Ramesh Kumar");
  assert.equal(voter.parent_name, "Ramesh Kumar");
  assert.equal(voter.voterGender, "Female");
  assert.equal(voter.gender, "Female");
  assert.equal(voter.voterAge, 41);
  assert.equal(voter.age, 41);
  assert.equal(voter.voterWardNo, "7");
  assert.equal(voter.ward, "7");
});

test("display helpers prefer canonical voter fields", () => {
  const voter = {
    electorName: "Maya Devi",
    elector_id: "EPIC-11",
    parent_name: "Ramesh Kumar",
    gender: "Female",
    age: "41",
    house_no: "A-5",
    serial_number: "12",
    svn_no: "SVN-44",
    relation_type: "D/O",
    ward: "7",
  };

  assert.equal(getVoterName(voter), "Maya Devi");
  assert.equal(getVoterId(voter), "EPIC-11");
  assert.equal(getVoterGuardian(voter), "Ramesh Kumar");
  assert.equal(getVoterGender(voter), "Female");
  assert.equal(getVoterAge(voter), 41);
  assert.equal(getVoterWard(voter), "7");
  assert.equal(getVoterHouseNo(voter), "A-5");
  assert.equal(getVoterSerialNumber(voter), "12");
  assert.equal(getVoterRelationship(voter), "Ramesh Kumar");
  assert.equal(getVoterSvnNo(voter), "SVN-44");
  assert.equal(getVoterRelationType(voter), "D/O");
});