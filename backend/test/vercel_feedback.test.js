const test = require('node:test');
const assert = require('node:assert/strict');

process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

const redis = new Map();
const counters = new Map();
global.fetch = async (_url, options) => {
  const command = JSON.parse(options.body);
  let result = null;

  if (command[0] === 'GET') {
    result = redis.get(command[1]) ?? null;
  } else if (command[0] === 'SET') {
    if (!command.includes('NX') || !redis.has(command[1])) redis.set(command[1], command[2]);
    result = 'OK';
  } else if (command[0] === 'EVAL' && command[1].includes("redis.call(\"INCR\"")) {
    const key = command[3];
    const count = (counters.get(key) || 0) + 1;
    counters.set(key, count);
    result = [count, 3600];
  } else if (command[0] === 'EVAL') {
    const key = command[3];
    const reviews = redis.has(key) ? JSON.parse(redis.get(key)) : JSON.parse(command[5]);
    reviews.unshift(JSON.parse(command[4]));
    reviews.splice(Number(command[6]));
    redis.set(key, JSON.stringify(reviews));
    result = JSON.stringify(reviews);
  }

  return { ok: true, status: 200, json: async () => ({ result }) };
};

const handler = require('../../api/feedback');

function responseMock() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

function request(body, address = '198.51.100.5') {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `203.0.113.200, ${address}`
    },
    body
  };
}

const validReview = {
  clientName: 'A Client',
  projectType: 'Portfolio',
  rating: 5,
  feedback: 'Helpful work.'
};

test('Vercel API validates size and malformed bodies before storage', async () => {
  const invalidJson = responseMock();
  await handler({ ...request('{bad'), body: '{bad' }, invalidJson);
  assert.equal(invalidJson.statusCode, 400);

  const oversized = responseMock();
  await handler({ ...request(validReview), headers: { 'content-type': 'application/json', 'content-length': '9000' } }, oversized);
  assert.equal(oversized.statusCode, 413);

  const empty = responseMock();
  await handler(request({ ...validReview, feedback: '   ' }, '198.51.100.6'), empty);
  assert.equal(empty.statusCode, 400);
});

test('Vercel API rate limits atomically and keeps pending reviews out of public GET', async () => {
  const responses = [];
  for (let index = 0; index < 6; index += 1) {
    const response = responseMock();
    await handler(request(validReview), response);
    responses.push(response);
  }
  assert.ok(responses.slice(0, 5).every((response) => response.statusCode === 202));
  assert.equal(responses[5].statusCode, 429);
  assert.ok(responses[5].headers['Retry-After']);

  const getResponse = responseMock();
  await handler({ method: 'GET', headers: {} }, getResponse);
  assert.equal(getResponse.statusCode, 200);
  assert.ok(getResponse.body.data.every((review) => review.status === undefined || review.status === 'approved'));
});
