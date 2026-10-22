const fs = require('fs');
const path = require('path');
const {
  MAX_BODY_BYTES,
  MAX_STORED_REVIEWS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  validateReview,
  makeReview,
  publicReviews,
  clientAddress,
  rateLimitKey
} = require('../backend/review_policy');

const feedbackFile = path.join(__dirname, '..', 'backend', 'feedback.json');
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisEnabled = Boolean(redisUrl && redisToken);
const feedbackKey = 'team-petix:feedback';

const saveReviewScript = [
  'local raw = redis.call("GET", KEYS[1])',
  'local reviews = raw and cjson.decode(raw) or cjson.decode(ARGV[2])',
  'table.insert(reviews, 1, cjson.decode(ARGV[1]))',
  'while #reviews > tonumber(ARGV[3]) do table.remove(reviews) end',
  'local updated = cjson.encode(reviews)',
  'redis.call("SET", KEYS[1], updated)',
  'return updated'
].join('; ');

const rateLimitScript = [
  'local count = redis.call("INCR", KEYS[1])',
  'if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end',
  'local ttl = redis.call("TTL", KEYS[1])',
  'return {count, ttl}'
].join('; ');

function readFeedback() {
  try {
    const feedback = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
    return Array.isArray(feedback) ? feedback : [];
  } catch {
    return [];
  }
}

function parseFeedback(value) {
  if (typeof value !== 'string') return [];
  try {
    const feedback = JSON.parse(value);
    return Array.isArray(feedback) ? feedback : [];
  } catch {
    return [];
  }
}

async function redisCommand(command) {
  const result = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000)
  });
  const payload = await result.json();
  if (!result.ok || payload.error) {
    throw new Error(payload.error || `Upstash request failed with status ${result.status}.`);
  }
  return payload.result;
}

async function getStoredFeedback() {
  let stored = await redisCommand(['GET', feedbackKey]);
  if (stored === null) {
    await redisCommand(['SET', feedbackKey, JSON.stringify(readFeedback()), 'NX']);
    stored = await redisCommand(['GET', feedbackKey]);
  }
  return parseFeedback(stored);
}

function jsonBody(request) {
  const contentType = request.headers?.['content-type'] || request.headers?.['Content-Type'] || '';
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    return { error: 'Submit reviews as application/json.', status: 415 };
  }

  const contentLength = Number(request.headers?.['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return { error: 'Request is too large.', status: 413 };
  }

  let body = request.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return { error: 'Request is too large.', status: 413 };
    try {
      body = JSON.parse(body);
    } catch {
      return { error: 'Request body must be valid JSON.', status: 400 };
    }
  }
  if (body === undefined || body === null) return { error: 'A JSON object is required.', status: 400 };
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return { error: 'Request is too large.', status: 413 };
  }
  return { body };
}

module.exports = async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    if (!redisEnabled) {
      return response.status(200).json({ success: true, data: publicReviews(readFeedback()) });
    }
    try {
      return response.status(200).json({ success: true, data: publicReviews(await getStoredFeedback()) });
    } catch (error) {
      console.error('Failed to load feedback from Upstash.', error);
      return response.status(503).json({ success: false, message: 'Feedback storage is temporarily unavailable.' });
    }
  }

  if (request.method === 'POST') {
    const parsedBody = jsonBody(request);
    if (parsedBody.error) {
      return response.status(parsedBody.status).json({ success: false, message: parsedBody.error });
    }
    const parsed = validateReview(parsedBody.body);
    if (parsed.spam) {
      return response.status(400).json({ success: false, message: 'Review could not be accepted.' });
    }
    if (parsed.error) return response.status(400).json({ success: false, message: parsed.error });
    if (!redisEnabled) {
      return response.status(503).json({
        success: false,
        message: 'Online review submissions are temporarily unavailable.'
      });
    }

    try {
      const address = clientAddress(request, true);
      const [count, retryAfter] = await redisCommand([
        'EVAL', rateLimitScript, '1',
        `team-petix:review-rate:${rateLimitKey(address)}`,
        String(RATE_LIMIT_WINDOW_SECONDS)
      ]);
      if (Number(count) > RATE_LIMIT_MAX) {
        response.setHeader('Retry-After', String(Math.max(1, Number(retryAfter))));
        return response.status(429).json({ success: false, message: 'Too many submissions. Please try again later.' });
      }

      const newEntry = makeReview(parsed.value);
      await redisCommand([
        'EVAL', saveReviewScript, '1', feedbackKey,
        JSON.stringify(newEntry), JSON.stringify(readFeedback()), String(MAX_STORED_REVIEWS)
      ]);
      return response.status(202).json({
        success: true,
        message: 'Thank you. Your review was received and will appear after it is approved.'
      });
    } catch (error) {
      console.error('Failed to limit or save review in Upstash.', error);
      return response.status(503).json({ success: false, message: 'Review submissions are temporarily unavailable.' });
    }
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ success: false, message: 'Method not allowed.' });
};
