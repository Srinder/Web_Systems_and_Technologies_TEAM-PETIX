const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createReviewStore } = require('../review_store');

async function withTemporaryFile(initialContents, run) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'petix-store-'));
  const filePath = path.join(directory, 'feedback.json');
  if (initialContents !== undefined) await fs.promises.writeFile(filePath, initialContents, 'utf8');
  try {
    await run(filePath, directory);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
}

test('unreadable storage is an error and is never replaced with an empty list', async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'petix-unreadable-'));
  const filePath = path.join(directory, 'feedback.json');
  await fs.promises.mkdir(filePath);
  const store = createReviewStore(filePath);
  try {
    await assert.rejects(store.read());
    await assert.rejects(store.update(() => [{ id: 'new' }]));
    assert.equal((await fs.promises.stat(filePath)).isDirectory(), true);
    assert.deepEqual(await fs.promises.readdir(directory), ['feedback.json']);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
});

test('invalid JSON is preserved and blocks updates', async () => {
  const contents = '{invalid json';
  await withTemporaryFile(contents, async (filePath) => {
    const store = createReviewStore(filePath);
    await assert.rejects(store.read(), SyntaxError);
    await assert.rejects(store.update(() => [{ id: 'new' }]), SyntaxError);
    assert.equal(await fs.promises.readFile(filePath, 'utf8'), contents);
  });
});

test('failed atomic rename leaves the existing review file intact', async () => {
  const originalReviews = [{ id: 'existing', status: 'approved' }];
  const originalContents = JSON.stringify(originalReviews);
  await withTemporaryFile(originalContents, async (filePath, directory) => {
    const fileSystem = {
      readFile: (...args) => fs.promises.readFile(...args),
      writeFile: (...args) => fs.promises.writeFile(...args),
      unlink: (...args) => fs.promises.unlink(...args),
      rename: async () => { throw Object.assign(new Error('simulated rename failure'), { code: 'EIO' }); }
    };
    const store = createReviewStore(filePath, fileSystem);
    await assert.rejects(store.update((reviews) => [{ id: 'new' }, ...reviews]));
    assert.deepEqual(JSON.parse(await fs.promises.readFile(filePath, 'utf8')), originalReviews);
    assert.deepEqual(await fs.promises.readdir(directory), ['feedback.json']);
  });
});

test('concurrent updates serialize and preserve every review', async () => {
  await withTemporaryFile('[]', async (filePath) => {
    const store = createReviewStore(filePath);
    const updates = Array.from({ length: 40 }, (_, index) =>
      store.update((reviews) => [{ id: index }, ...reviews])
    );
    await Promise.all(updates);
    const storedReviews = await store.read();
    assert.equal(storedReviews.length, 40);
    assert.equal(new Set(storedReviews.map((review) => review.id)).size, 40);
  });
});
