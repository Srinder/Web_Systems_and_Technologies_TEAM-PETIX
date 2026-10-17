const fs = require('fs');
const path = require('path');

const feedbackFile = path.join(__dirname, '..', 'backend', 'feedback.json');
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisEnabled = Boolean(redisUrl && redisToken);
const feedbackKey = 'team-petix:feedback';

const saveReviewScript = [
  'local raw = redis.call("GET", KEYS[1])',
  'local reviews = raw and cjson.decode(raw) or cjson.decode(ARGV[2])',
  'table.insert(reviews, 1, cjson.decode(ARGV[1]))',
  'local updated = cjson.encode(reviews)',
  'redis.call("SET", KEYS[1], updated)',
  'return updated'
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
    body: JSON.stringify(command)
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

module.exports = async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    if (!redisEnabled) {
      return response.status(200).json({ success: true, data: readFeedback() });
    }

    try {
      return response.status(200).json({ success: true, data: await getStoredFeedback() });
    } catch (error) {
      console.error('Failed to load feedback from Upstash.', error);
      return response.status(503).json({ success: false, message: 'Feedback storage is temporarily unavailable.' });
    }
  }

  if (request.method === 'POST') {
    const { clientName, projectType, rating, feedback } = request.body || {};
    const normalizedClientName = typeof clientName === 'string' ? clientName.trim() : '';
    const normalizedProjectType = typeof projectType === 'string' ? projectType.trim() : '';
    const normalizedFeedback = typeof feedback === 'string' ? feedback.trim() : '';
    const ratingValue = typeof rating === 'string' ? rating.trim() : rating;
    const numericRating = Number(ratingValue);

    if (!normalizedClientName || normalizedClientName.length > 100) {
      return response.status(400).json({ success: false, message: 'Client name is required and must be 100 characters or fewer.' });
    }
    if (projectType !== undefined && typeof projectType !== 'string') {
      return response.status(400).json({ success: false, message: 'Project or service must be text.' });
    }
    if (normalizedProjectType.length > 120) {
      return response.status(400).json({ success: false, message: 'Project or service must be 120 characters or fewer.' });
    }
    if (!normalizedFeedback || normalizedFeedback.length > 2000) {
      return response.status(400).json({ success: false, message: 'Feedback is required and must be 2,000 characters or fewer.' });
    }
    if ((typeof ratingValue !== 'number' && typeof ratingValue !== 'string') ||
        ratingValue === '' || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return response.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5.' });
    }
    if (!redisEnabled) {
      return response.status(503).json({
        success: false,
        message: 'Online feedback submissions require UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
      });
    }

    const newEntry = {
      id: Date.now(),
      clientName: normalizedClientName,
      projectType: normalizedProjectType || 'General Portfolio',
      rating: numericRating,
      feedback: normalizedFeedback,
      date: new Date().toISOString()
    };

    try {
      await redisCommand([
        'EVAL',
        saveReviewScript,
        '1',
        feedbackKey,
        JSON.stringify(newEntry),
        JSON.stringify(readFeedback())
      ]);
      return response.status(201).json({
        success: true,
        message: `Thank you, ${normalizedClientName}! Your ${numericRating}-star review has been saved successfully.`,
        data: newEntry
      });
    } catch (error) {
      console.error('Failed to save feedback to Upstash.', error);
      return response.status(503).json({ success: false, message: 'Feedback storage is temporarily unavailable.' });
    }
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ success: false, message: 'Method not allowed.' });
};
