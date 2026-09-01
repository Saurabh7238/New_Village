import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APPLICATION_STATUSES,
  isDocumentRequestStatus,
  getNextStatusAfterCitizenUpload,
} from '../lib/applicationWorkflow.js';

test('application workflow includes Updated and allows document upload after Need Documents', () => {
  assert.ok(APPLICATION_STATUSES.includes('Updated'));
  assert.equal(isDocumentRequestStatus('Need Documents'), true);
  assert.equal(isDocumentRequestStatus('Updated'), true);
  assert.equal(getNextStatusAfterCitizenUpload('Need Documents'), 'Updated');
  assert.equal(getNextStatusAfterCitizenUpload('Updated'), 'Updated');
});
