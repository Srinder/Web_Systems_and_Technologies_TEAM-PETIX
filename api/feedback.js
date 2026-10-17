const fs = require('fs');
const path = require('path');

const feedbackFile = path.join(__dirname, '..', 'backend', 'feedback.json');

function readFeedback() {
  try {
    const feedback = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
    return Array.isArray(feedback) ? feedback : [];
  } catch {
    return [];
  }
}

module.exports = (request, response) => {
  if (request.method === 'GET') {
    return response.status(200).json({ success: true, data: readFeedback() });
  }

  if (request.method === 'POST') {
    return response.status(503).json({
      success: false,
      message: 'Feedback submission is available locally only until persistent online storage is configured.'
    });
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ success: false, message: 'Method not allowed.' });
};
