import test from 'node:test';
import assert from 'node:assert/strict';
import { isDateOnlyNotInFuture, parseDateOnly } from '../lib/dateOnly.js';
import { dataUrlByteLength, hasDocumentQuota, MAX_USER_DOCUMENT_BYTES } from '../lib/documentQuota.js';
import { checkRequestRateLimit } from '../lib/requestRateLimit.js';
import { validateApplicationForm } from '../lib/applicationValidation.js';

test('parses strict date-only values without timezone drift', () => {
  assert.equal(parseDateOnly('2000-02-29').toISOString(), '2000-02-29T00:00:00.000Z');
  assert.equal(parseDateOnly('2001-02-29'), null);
  assert.equal(isDateOnlyNotInFuture('2000-02-29', new Date('2026-09-03T23:00:00Z')), true);
  assert.equal(isDateOnlyNotInFuture('2026-09-04', new Date('2026-09-03T23:00:00Z')), false);
});

test('calculates data URL bytes and enforces aggregate quota', () => {
  const document = { fileUrl: 'data:text/plain;base64,SGVsbG8=' };
  assert.equal(dataUrlByteLength(document.fileUrl), 5);
  assert.equal(hasDocumentQuota(MAX_USER_DOCUMENT_BYTES - 5, [document]), true);
  assert.equal(hasDocumentQuota(MAX_USER_DOCUMENT_BYTES - 4, [document]), false);
});

test('limits repeated requests within a window', () => {
  const key = `test-${Date.now()}`;
  assert.equal(checkRequestRateLimit(key, { limit: 2, windowMs: 10000 }).allowed, true);
  assert.equal(checkRequestRateLimit(key, { limit: 2, windowMs: 10000 }).allowed, true);
  assert.equal(checkRequestRateLimit(key, { limit: 2, windowMs: 10000 }).allowed, false);
});

test('validates required application fields before submission', () => {
  assert.match(validateApplicationForm('birth-certificate', { childName: 'Asha' }), /dateOfBirth/);
  assert.equal(validateApplicationForm('birth-certificate', { childName: 'Asha', dateOfBirth: '2020-01-01', gender: 'female', placeOfBirth: 'Village', motherName: 'Mina' }), null);
});
