const test = require('node:test');
const assert = require('node:assert/strict');
const {
  RATE_LIMIT_MAX,
  createMemoryRateLimiter,
  validateReview,
  publicReviews
} = require('../review_policy');

const validReview = {
  clientName: 'A Client',
  projectType: 'Portfolio',
  rating: 5,
  feedback: 'Helpful work.'
};

test('review validation accepts valid text and normalizes whitespace', () => {
  const result = validateReview({ ...validReview, clientName: '  A Client  ', feedback: '  Helpful work.  ' });
  assert.deepEqual(result.value, { ...validReview, clientName: 'A Client', feedback: 'Helpful work.' });
});

test('review validation rejects malformed, empty, oversized, and unexpected fields', () => {
  assert.ok(validateReview(null).error);
  assert.ok(validateReview({ ...validReview, feedback: '   ' }).error);
  assert.ok(validateReview({ ...validReview, feedback: 'x'.repeat(1001) }).error);
  assert.ok(validateReview({ ...validReview, clientName: 'x'.repeat(81) }).error);
  assert.ok(validateReview({ ...validReview, rating: 5.5 }).error);
  assert.ok(validateReview({ ...validReview, extra: 'unexpected' }).error);
});

test('honeypot submissions are detected', () => {
  assert.equal(validateReview({ ...validReview, website: 'bot-filled-this' }).spam, true);
});

test('public review feed only includes approved and legacy curated records and is capped', () => {
  const reviews = Array.from({ length: 25 }, (_, index) => ({ id: index, status: 'approved' }));
  reviews.push({ id: 'pending', status: 'pending' }, { id: 'legacy' });
  const visible = publicReviews(reviews);
  assert.equal(visible.length, 20);
  assert.ok(visible.every((review) => review.status === 'approved'));
});

test('local rate limiter allows five requests and rejects the next in the window', () => {
  const limit = createMemoryRateLimiter();
  const outcomes = Array.from({ length: RATE_LIMIT_MAX + 1 }, () => limit('127.0.0.1'));
  assert.equal(outcomes.filter((outcome) => outcome.allowed).length, RATE_LIMIT_MAX);
  assert.equal(outcomes.at(-1).allowed, false);
});
