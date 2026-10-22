const crypto = require('crypto');
const net = require('net');

const MAX_BODY_BYTES = 8 * 1024;
const MAX_CLIENT_NAME = 80;
const MAX_PROJECT_TYPE = 100;
const MAX_FEEDBACK = 1000;
const MAX_PUBLIC_REVIEWS = 20;
const MAX_STORED_REVIEWS = 500;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const ALLOWED_FIELDS = new Set(['clientName', 'projectType', 'rating', 'feedback', 'website']);
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function validateReview(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'A JSON object is required.' };
  }
  if (Object.keys(body).some((field) => !ALLOWED_FIELDS.has(field))) {
    return { error: 'The review contains an unexpected field.' };
  }
  if (typeof body.website !== 'undefined' && body.website !== '') {
    return { spam: true };
  }

  const { clientName, projectType, rating, feedback } = body;
  if (typeof clientName !== 'string' || typeof projectType !== 'string' || typeof feedback !== 'string') {
    return { error: 'Name, project, and feedback must be text.' };
  }

  const normalizedClientName = clientName.trim();
  const normalizedProjectType = projectType.trim();
  const normalizedFeedback = feedback.trim();
  if (!normalizedClientName || normalizedClientName.length > MAX_CLIENT_NAME) {
    return { error: `Name is required and must be ${MAX_CLIENT_NAME} characters or fewer.` };
  }
  if (!normalizedProjectType || normalizedProjectType.length > MAX_PROJECT_TYPE) {
    return { error: `Project is required and must be ${MAX_PROJECT_TYPE} characters or fewer.` };
  }
  if (!normalizedFeedback || normalizedFeedback.length > MAX_FEEDBACK) {
    return { error: `Feedback is required and must be ${MAX_FEEDBACK} characters or fewer.` };
  }
  if ([normalizedClientName, normalizedProjectType, normalizedFeedback].some((value) => CONTROL_CHARACTERS.test(value))) {
    return { error: 'Fields cannot contain control characters.' };
  }

  const ratingValue = typeof rating === 'string' ? rating.trim() : rating;
  const numericRating = Number(ratingValue);
  if ((typeof ratingValue !== 'number' && typeof ratingValue !== 'string') || ratingValue === '' ||
      !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return { error: 'Rating must be a whole number from 1 to 5.' };
  }

  return {
    value: {
      clientName: normalizedClientName,
      projectType: normalizedProjectType,
      rating: numericRating,
      feedback: normalizedFeedback
    }
  };
}

function makeReview(review) {
  return {
    id: crypto.randomUUID(),
    ...review,
    date: new Date().toISOString(),
    status: 'pending'
  };
}

function publicReviews(reviews) {
  return reviews
    .filter((review) => review && (review.status === 'approved' || review.status === undefined))
    .slice(0, MAX_PUBLIC_REVIEWS);
}

function clientAddress(request, trustForwardedFor = false) {
  let address = request.socket?.remoteAddress || '';
  if (trustForwardedFor) {
    const realIp = request.headers?.['x-real-ip'];
    if (typeof realIp === 'string' && net.isIP(realIp.trim())) address = realIp.trim();
    const forwarded = request.headers?.['x-forwarded-for'];
    if (address === (request.socket?.remoteAddress || '') && typeof forwarded === 'string') {
      const candidates = forwarded.split(',').map((item) => item.trim()).filter(Boolean);
      if (candidates.length) address = candidates[candidates.length - 1];
    }
  }
  if (address.startsWith('::ffff:')) address = address.slice(7);
  return net.isIP(address) ? address : 'unknown';
}

function rateLimitKey(address) {
  return crypto.createHash('sha256').update(address).digest('hex');
}

function createMemoryRateLimiter() {
  const buckets = new Map();
  return (address, now = Date.now()) => {
    const key = rateLimitKey(address);
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (bucket) buckets.delete(key);
      if (buckets.size >= 10000) {
        for (const [entryKey, entry] of buckets) {
          if (entry.resetAt <= now) buckets.delete(entryKey);
        }
        if (buckets.size >= 10000) {
          return { allowed: false, retryAfter: RATE_LIMIT_WINDOW_SECONDS };
        }
      }
      buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 });
      return { allowed: true, retryAfter: RATE_LIMIT_WINDOW_SECONDS };
    }
    bucket.count += 1;
    return {
      allowed: bucket.count <= RATE_LIMIT_MAX,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  };
}

module.exports = {
  MAX_BODY_BYTES,
  MAX_CLIENT_NAME,
  MAX_PROJECT_TYPE,
  MAX_FEEDBACK,
  MAX_PUBLIC_REVIEWS,
  MAX_STORED_REVIEWS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  validateReview,
  makeReview,
  publicReviews,
  clientAddress,
  rateLimitKey,
  createMemoryRateLimiter
};
