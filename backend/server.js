const express = require('express');
const path = require('path');
const {
    MAX_BODY_BYTES,
    MAX_STORED_REVIEWS,
    RATE_LIMIT_MAX,
    validateReview,
    makeReview,
    publicReviews,
    clientAddress,
    createMemoryRateLimiter
} = require('./review_policy');
const { createReviewStore } = require('./review_store');

const app = express();
const DATA_FILE = process.env.TEAM_PETIX_FEEDBACK_FILE || path.join(__dirname, 'feedback.json');
const rateLimit = createMemoryRateLimiter();
const reviewStore = createReviewStore(DATA_FILE);

const isLocalOrigin = (origin) => {
    try {
        const requestOrigin = new URL(origin);
        return requestOrigin.protocol === 'http:' &&
            ['localhost', '127.0.0.1', '[::1]'].includes(requestOrigin.hostname);
    } catch {
        return false;
    }
};

app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && isLocalOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Vary', 'Origin');
        if (req.method === 'OPTIONS') return res.sendStatus(204);
    }
    next();
});

app.use(express.json({ limit: MAX_BODY_BYTES, strict: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/api/feedback', async (req, res) => {
    try {
        return res.status(200).json({ success: true, data: publicReviews(await reviewStore.read()) });
    } catch (error) {
        console.error('Failed to read feedback.', error);
        return res.status(503).json({ success: false, message: 'Feedback storage is unavailable; reviews could not be loaded.' });
    }
});

app.post('/api/feedback', async (req, res) => {
    if (!req.is('application/json')) {
        return res.status(415).json({ success: false, message: 'Submit reviews as application/json.' });
    }

    const parsed = validateReview(req.body);
    if (parsed.spam) {
        return res.status(400).json({ success: false, message: 'Review could not be accepted.' });
    }
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });

    const limit = rateLimit(clientAddress(req));
    if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter));
        return res.status(429).json({
            success: false,
            message: `Too many submissions. Try again in about ${Math.ceil(limit.retryAfter / 60)} minutes.`
        });
    }

    try {
        const newEntry = makeReview(parsed.value);
        await reviewStore.update((currentFeedback) => [newEntry, ...currentFeedback].slice(0, MAX_STORED_REVIEWS));
        return res.status(202).json({
            success: true,
            message: 'Thank you. Your review was received and will appear after it is approved.'
        });
    } catch (error) {
        console.error('Failed to save feedback.', error);
        return res.status(503).json({ success: false, message: 'Feedback storage is unavailable; no review was saved.' });
    }
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'Request is too large.' });
    }
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ success: false, message: 'Request body must be valid JSON.' });
    }
    console.error('Request failed.', error);
    return res.status(400).json({ success: false, message: 'Request could not be processed.' });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
