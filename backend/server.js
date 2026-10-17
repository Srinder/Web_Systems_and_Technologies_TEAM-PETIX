const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const getFeedbackPath = () => {
    const localPath = path.join(__dirname, 'feedback.json');
    if (fs.existsSync(localPath)) return localPath;
    return path.join(process.cwd(), 'backend', 'feedback.json');
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(FRONTEND_DIR));
app.use(express.static(path.join(FRONTEND_DIR, 'html')));


function getStoredFeedback() {
    try {
        const data = fs.readFileSync(getFeedbackPath(), 'utf8');
        const feedback = JSON.parse(data);
        return Array.isArray(feedback) ? feedback : [];
    } catch {
        return [];
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// GET endpoint to retrieve all testimonials
app.get('/api/feedback', (req, res) => {
    const feedbackList = getStoredFeedback();
    res.status(200).json({ success: true, data: feedbackList });
});

// POST endpoint for Testimonial / Feedback submission with persistence
app.post('/api/feedback', (req, res) => {
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

    const currentFeedback = getStoredFeedback();
    currentFeedback.unshift(newEntry); // Add newest first
    try {
        fs.writeFileSync(getFeedbackPath(), JSON.stringify(currentFeedback, null, 2), 'utf8');
    } catch (error) {
        console.error('Failed to save feedback.', error);
        return res.status(500).json({
            success: false,
            message: 'Feedback could not be saved right now.'
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