import test from 'node:test';
import assert from 'node:assert/strict';

import { addStatusHistoryEntry, filterRequestHistory } from '../lib/requestHistory.js';
import { canRetryEmailDelivery } from '../lib/emailDeliveryStatus.js';

const requests = [
  {
    type: 'application',
    item: {
      serviceType: 'birth-certificate',
      applicationNumber: 'APP-100',
      status: 'Under Review',
      createdAt: '2026-10-10T10:00:00.000Z',
    },
  },
  {
    type: 'query',
    item: {
      category: 'Road',
      subject: 'Repair near school',
      queryId: 'GP-200',
      status: 'Resolved',
      createdAt: '2026-10-20T10:00:00.000Z',
    },
  },
  {
    type: 'appointment',
    item: {
      appointmentNumber: 'APT-300',
      purpose: 'Birth certificate assistance',
      status: 'Pending',
      createdAt: '2026-10-25T10:00:00.000Z',
    },
  },
];

test('request history filters by service, status, text, and date', () => {
  assert.deepEqual(
    filterRequestHistory(requests, { type: 'birth-certificate' }).map(({ item }) => item.applicationNumber),
    ['APP-100'],
  );
  assert.deepEqual(
    filterRequestHistory(requests, { type: 'query', status: 'Resolved', search: 'school' }).map(({ item }) => item.queryId),
    ['GP-200'],
  );
  assert.deepEqual(
    filterRequestHistory(requests, { dateFrom: '2026-10-20', dateTo: '2026-10-31' }).map(({ type }) => type),
    ['query', 'appointment'],
  );
});

test('status history records a changed status once', () => {
  const first = addStatusHistoryEntry([], { status: 'Submitted', changedBy: 'Citizen' });
  assert.equal(first.length, 1);
  assert.equal(addStatusHistoryEntry(first, { status: 'Submitted', changedBy: 'Citizen' }).length, 1);
  assert.equal(addStatusHistoryEntry(first, { status: 'Approved', changedBy: 'Admin' }).length, 2);
});

test('only failed and skipped email deliveries can be retried', () => {
  assert.equal(canRetryEmailDelivery('failed'), true);
  assert.equal(canRetryEmailDelivery('skipped'), true);
  assert.equal(canRetryEmailDelivery('sent'), false);
  assert.equal(canRetryEmailDelivery('sending'), false);
});
