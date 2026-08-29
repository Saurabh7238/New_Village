import test from 'node:test';
import assert from 'node:assert/strict';

import { sanitizePublicReviews, isReviewVisibleForPublic } from '../lib/reviewVisibility.js';

test('pending reviews stay hidden until admin approval', () => {
  const reviews = [
    { id: '1', status: 'pending', approved: false, message: 'Waiting approval' },
    { id: '2', status: 'approved', approved: true, message: 'Live review' },
    { id: '3', status: undefined, approved: true, message: 'Legacy approved' },
    { id: '4', status: 'rejected', approved: false, message: 'Rejected review' },
  ];

  assert.deepEqual(sanitizePublicReviews(reviews).map((review) => review.id), ['2', '3']);
  assert.equal(isReviewVisibleForPublic(reviews[0]), false);
  assert.equal(isReviewVisibleForPublic(reviews[1]), true);
});
