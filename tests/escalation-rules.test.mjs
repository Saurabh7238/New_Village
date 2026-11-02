import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSlaBreach } from '../lib/escalationRules.js';

test('flags new grievances after their acknowledgement SLA', () => {
  const result = checkSlaBreach({
    queryId: 'GP/2026/00001',
    category: 'Water',
    status: 'New',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  assert.equal(result.breached, true);
  assert.equal(result.type, 'acknowledgment');
});

test('flags in-progress grievances after their resolution SLA', () => {
  const result = checkSlaBreach({
    queryId: 'GP/2026/00002',
    category: 'Water',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  assert.equal(result.breached, true);
  assert.equal(result.type, 'resolution');
});

test('does not report completed grievances as overdue', () => {
  const result = checkSlaBreach({
    queryId: 'GP/2026/00003',
    category: 'Water',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  });

  assert.equal(result.breached, false);
  assert.equal(result.type, null);
});
