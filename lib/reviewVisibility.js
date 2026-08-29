export function isReviewVisibleForPublic(review) {
  if (!review || typeof review !== 'object') return false;

  const status = String(review.status ?? '').trim().toLowerCase();
  const isLegacyApproved = review.approved === true && !review.status;

  return status === 'approved' || isLegacyApproved;
}

export function sanitizePublicReviews(reviews) {
  if (!Array.isArray(reviews)) return [];
  return reviews.filter(isReviewVisibleForPublic);
}
