const fs = require('fs');
const crypto = require('crypto');

function createReviewStore(filePath, fileSystem = fs.promises) {
  let updateQueue = Promise.resolve();

  async function read() {
    const contents = await fileSystem.readFile(filePath, 'utf8');
    const reviews = JSON.parse(contents);
    if (!Array.isArray(reviews)) {
      throw new Error('Feedback storage must contain a JSON array.');
    }
    return reviews;
  }

  async function write(reviews) {
    const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
      await fileSystem.writeFile(temporaryPath, JSON.stringify(reviews, null, 2), {
        encoding: 'utf8',
        flag: 'wx'
      });
      await fileSystem.rename(temporaryPath, filePath);
    } catch (error) {
      try {
        await fileSystem.unlink(temporaryPath);
      } catch { }
      throw error;
    }
  }

  function update(updater) {
    const operation = updateQueue.then(async () => {
      const currentReviews = await read();
      const nextReviews = await updater(currentReviews);
      if (!Array.isArray(nextReviews)) {
        throw new Error('Review update must produce a JSON array.');
      }
      await write(nextReviews);
      return nextReviews;
    });
    updateQueue = operation.catch(() => {});
    return operation;
  }

  return { read, update };
}

module.exports = { createReviewStore };
