const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'feedback.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'html')));



let fileQueue = Promise.resolve();

function enqueue(task) {
    const result = fileQueue.then(task);
    fileQueue = result.catch(() => {});
    return result;
}

async function readFeedbackFile() {
    try {
        const data = await fs.promises.readFile(DATA_FILE, 'utf8');
        const feedback = JSON.parse(data);
        return Array.isArray(feedback) ? feedback : [];
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn('Could not read feedback.json, falling back to empty list.', error.message);
        }
        return [];
    }
}

async function writeFeedbackFile(feedback) {
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.promises.writeFile(tempFile, JSON.stringify(feedback, null, 2), 'utf8');
    await fs.promises.rename(tempFile, DATA_FILE);
}

function getStoredFeedback() {
    return enqueue(readFeedbackFile);
}

function addFeedback(entry) {
    return enqueue(async () => {
        const current = await readFeedbackFile();
        const maxId = current.reduce((max, item) => Math.max(max, Number(item && item.id) || 0), 0);
        entry.id = Math.max(entry.id, maxId + 1);
        current.unshift(entry);
        await writeFeedbackFile(current);
    });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET endpoint to retrieve all testimonials
app.get('/api/feedback', async (req, res) => {
    try {
        const feedbackList = await getStoredFeedback();
        res.status(200).json({ success: true, data: feedbackList });
    } catch (error) {
        console.error('Failed to read feedback.', error);
        res.status(500).json({ success: false, message: 'Feedback could not be loaded right now.' });
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

    try {
        await addFeedback(newEntry);
    } catch (error) {
        console.error('Failed to save feedback.', error);
        return res.status(500).json({
            success: false,
            message: 'Feedback could not be saved right now. Please try again later.'
        });
    }

    console.log('Saved New Testimonial:', newEntry);

    res.status(201).json({
        success: true,
        message: `Thank you, ${clientName}! Your ${numericRating}-star review has been saved successfully.`,
        data: newEntry
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running Advanced Mode on http://localhost:${PORT}`);
    });
}

module.exports = app;