import test from 'node:test';
import assert from 'node:assert/strict';

import { canDeleteUploadedDocument } from '../lib/citizenDocumentAccess.js';

test('allows deleting documents uploaded by the current citizen', () => {
  assert.equal(
    canDeleteUploadedDocument({ uploadedBy: 'citizen', userId: 'user-123' }, 'user-123'),
    true,
  );
});

test('blocks deleting admin documents or files not uploaded by the current citizen', () => {
  assert.equal(
    canDeleteUploadedDocument({ uploadedBy: 'admin', userId: 'user-123' }, 'user-123'),
    false,
  );
  assert.equal(
    canDeleteUploadedDocument({ uploadedBy: 'citizen', userId: 'other-user' }, 'user-123'),
    false,
  );
});
