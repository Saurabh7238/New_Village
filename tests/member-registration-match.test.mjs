import test from 'node:test';
import assert from 'node:assert/strict';

import { findMemberMatch } from '../lib/memberRegistrationMatch.js';

test('matches a member using Aadhaar or personal details', () => {
  const members = [
    {
      _id: 'member-1',
      fullName: 'Ravi Kumar',
      fatherHusbandName: 'Suresh',
      mobileNumber: '9876543210',
      aadhaarFingerprint: 'abc123',
      userId: null,
    },
  ];

  const byAadhaar = findMemberMatch({
    name: 'Ravi Kumar',
    fatherName: 'Suresh',
    phone: '9876543210',
    aadhaarFingerprint: 'abc123',
    members,
  });

  const byIdentity = findMemberMatch({
    name: '  ravi   kumar ',
    fatherName: '  suresh  ',
    phone: '9876543210',
    aadhaarFingerprint: 'wrong-fingerprint',
    members,
  });

  assert.equal(byAadhaar?._id, 'member-1');
  assert.equal(byIdentity?._id, 'member-1');
});

test('rejects a member if the identity does not match the member list', () => {
  const members = [
    {
      _id: 'member-1',
      fullName: 'Ravi Kumar',
      fatherHusbandName: 'Suresh',
      mobileNumber: '9876543210',
      aadhaarFingerprint: 'abc123',
      userId: null,
    },
  ];

  const match = findMemberMatch({
    name: 'Amit Sharma',
    fatherName: 'Naresh',
    phone: '9876543210',
    aadhaarFingerprint: 'zzz999',
    members,
  });

  assert.equal(match, null);
});

test('flags a member who has already signed up as a user', () => {
  const members = [
    {
      _id: 'member-1',
      fullName: 'Ravi Kumar',
      fatherHusbandName: 'Suresh',
      mobileNumber: '9876543210',
      aadhaarFingerprint: 'abc123',
      userId: 'user-123',
    },
  ];

  const match = findMemberMatch({
    name: 'Ravi Kumar',
    fatherName: 'Suresh',
    phone: '9876543210',
    aadhaarFingerprint: 'abc123',
    members,
  });

  assert.equal(match?.userId, 'user-123');
});
