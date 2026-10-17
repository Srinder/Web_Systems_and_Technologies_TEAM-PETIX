const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = Boolean(REDIS_URL && REDIS_TOKEN);
const FEEDBACK_KEY = 'team-petix:feedback';

const getFeedbackPath = () => {
    const localPath = path.join(__dirname, 'feedback.json');
    if (fs.existsSync(localPath)) return localPath;
    return path.join(process.cwd(), 'backend', 'feedback.json');
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(FRONTEND_DIR));
app.use(express.static(path.join(FRONTEND_DIR, 'html')));


function getLocalFeedback() {
    try {
        const data = fs.readFileSync(getFeedbackPath(), 'utf8');
        const feedback = JSON.parse(data);
        return Array.isArray(feedback) ? feedback : [];
    } catch {
        return [];
    }
}

async function redisCommand(command) {
    const response = await fetch(REDIS_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${REDIS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(command)
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
        throw new Error(payload.error || `Upstash request failed with status ${response.status}.`);
    }
    return payload.result;
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

async function getStoredFeedback() {
    if (!REDIS_ENABLED) return getLocalFeedback();

    let stored = await redisCommand(['GET', FEEDBACK_KEY]);
    if (stored === null) {
        await redisCommand(['SET', FEEDBACK_KEY, JSON.stringify(getLocalFeedback()), 'NX']);
        stored = await redisCommand(['GET', FEEDBACK_KEY]);
    }
    return parseFeedback(stored);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// GET endpoint to retrieve all testimonials
app.get('/api/feedback', async (req, res) => {
    try {
        const feedbackList = await getStoredFeedback();
        res.status(200).json({ success: true, data: feedbackList });
    } catch (error) {
        console.error('Failed to load feedback.', error);
        res.status(503).json({ success: false, message: 'Feedback storage is temporarily unavailable.' });
    }
});

// POST endpoint for Testimonial / Feedback submission with persistence
app.post('/api/feedback', async (req, res) => {
    const { clientName, projectType, rating, feedback } = req.body || {};
    const normalizedClientName = typeof clientName === 'string' ? clientName.trim() : '';
    const normalizedFeedback = typeof feedback === 'string' ? feedback.trim() : '';
    const normalizedProjectType = typeof projectType === 'string' ? projectType.trim() : '';

    if (!normalizedClientName || normalizedClientName.length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Client name is required and must be 100 characters or fewer.'
        });
    }

    if (projectType !== undefined && typeof projectType !== 'string') {
        return res.status(400).json({ success: false, message: 'Project or service must be text.' });
    }

    if (normalizedProjectType.length > 120) {
        return res.status(400).json({ success: false, message: 'Project or service must be 120 characters or fewer.' });
    }

    if (!normalizedFeedback || normalizedFeedback.length > 2000) {
        return res.status(400).json({
            success: false,
            message: 'Feedback is required and must be 2,000 characters or fewer.'
        });
    }

    const ratingValue = typeof rating === 'string' ? rating.trim() : rating;
    const numericRating = Number(ratingValue);
    if ((typeof ratingValue !== 'number' && typeof ratingValue !== 'string') ||
        ratingValue === '' || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be a whole number from 1 to 5.'
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

    if (process.env.NODE_ENV === 'production' && !REDIS_ENABLED) {
        return res.status(503).json({
            success: false,
            message: 'Feedback storage is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
        });
    }

    try {
        if (REDIS_ENABLED) {
            const seed = JSON.stringify(getLocalFeedback());
            await redisCommand([
                'EVAL',
                'local raw = redis.call("GET", KEYS[1]); local reviews = raw and cjson.decode(raw) or cjson.decode(ARGV[2]); table.insert(reviews, 1, cjson.decode(ARGV[1])); local updated = cjson.encode(reviews); redis.call("SET", KEYS[1], updated); return updated',
                '1',
                FEEDBACK_KEY,
                JSON.stringify(newEntry),
                seed
            ]);
        } else {
            const currentFeedback = getLocalFeedback();
            currentFeedback.unshift(newEntry);
            fs.writeFileSync(getFeedbackPath(), JSON.stringify(currentFeedback, null, 2), 'utf8');
        }
    } catch (error) {
        console.error('Failed to save feedback.', error);
        return res.status(503).json({
            success: false,
            message: 'Feedback storage is temporarily unavailable. Please try again later.'
        });
    }

    console.log('Saved New Testimonial:', newEntry);

    res.status(201).json({
        success: true,
        message: `Thank you, ${clientName}! Your ${numericRating}-star review has been saved successfully.`,
        data: newEntry
    });
});

if (require.main === module && process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Server is running Advanced Mode on http://localhost:${PORT}`);
    });
}

module.exports = app;