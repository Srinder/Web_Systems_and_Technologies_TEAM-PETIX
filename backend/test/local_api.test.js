const test = require('node:test');
const { before, after } = test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'petix-reviews-'));
const feedbackFile = path.join(temporaryDirectory, 'feedback.json');
fs.writeFileSync(feedbackFile, JSON.stringify(Array.from({ length: 22 }, (_, index) => ({
  id: index,
  clientName: `Curated ${index}`,
  projectType: 'Portfolio',
  rating: 5,
  feedback: 'Approved starter review.',
  date: new Date(0).toISOString(),
  status: 'approved'
}))), 'utf8');
process.env.TEAM_PETIX_FEEDBACK_FILE = feedbackFile;

const app = require('../server');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  delete process.env.TEAM_PETIX_FEEDBACK_FILE;
});

test('local API rejects malformed and oversized requests, then rate limits and moderates submissions', async () => {
  const badJson = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad'
  });
  assert.equal(badJson.status, 400);

  const oversized = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(9000) })
  });
  assert.equal(oversized.status, 413);

  const wrongContentType = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}'
  });
  assert.equal(wrongContentType.status, 415);

  const review = { clientName: 'A Client', projectType: 'Portfolio', rating: 5, feedback: 'Helpful work.' };
  const honeypot = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...review, website: 'bot' })
  });
  assert.equal(honeypot.status, 400);

  const originalFileContents = await fs.promises.readFile(feedbackFile, 'utf8');
  const invalidContents = '{invalid';
  await fs.promises.writeFile(feedbackFile, invalidContents, 'utf8');
  const unreadableFeed = await fetch(`${baseUrl}/api/feedback`);
  assert.equal(unreadableFeed.status, 503);
  const storageFailure = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review)
  });
  assert.equal(storageFailure.status, 503);
  assert.equal(await fs.promises.readFile(feedbackFile, 'utf8'), invalidContents);
  await fs.promises.writeFile(feedbackFile, originalFileContents, 'utf8');

  const results = await Promise.all(Array.from({ length: 6 }, () =>
    fetch(`${baseUrl}/api/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review)
    })
  ));
  assert.equal(results.filter((response) => response.status === 202).length, 4);
  const throttled = results.filter((response) => response.status === 429);
  assert.equal(throttled.length, 2);
  assert.ok(throttled.every((response) => response.headers.get('retry-after')));

  const storedReviews = JSON.parse(await fs.promises.readFile(feedbackFile, 'utf8'));
  assert.equal(storedReviews.filter((item) => item.status === 'pending').length, 4);

  const feedResponse = await fetch(`${baseUrl}/api/feedback`);
  const feed = await feedResponse.json();
  assert.equal(feed.data.length, 20);
  assert.ok(feed.data.every((item) => item.status === 'approved'));
});
