const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'html')));

const DATA_FILE = path.join(__dirname, 'feedback.json');


function getStoredFeedback() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET endpoint to retrieve all testimonials
app.get('/api/feedback', (req, res) => {
    const feedbackList = getStoredFeedback();
    res.status(200).json({ success: true, data: feedbackList });
});

// POST endpoint for Testimonial / Feedback submission with persistence
app.post('/api/feedback', (req, res) => {
    const { clientName, projectType, rating, feedback } = req.body;

    // Server-side Validation
    if (!clientName || !rating || !feedback) {
        return res.status(400).json({
            success: false,
            message: 'Please provide your name, a rating, and your feedback.'
        });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5 stars.'
        });
    }

    const newEntry = {
        id: Date.now(),
        clientName: clientName.trim(),
        projectType: projectType ? projectType.trim() : 'General Portfolio',
        rating: numericRating,
        feedback: feedback.trim(),
        date: new Date().toISOString()
    };

    const currentFeedback = getStoredFeedback();
    currentFeedback.unshift(newEntry); // Add newest first
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentFeedback, null, 2), 'utf8');

    console.log('Saved New Testimonial:', newEntry);

    res.status(201).json({
        success: true,
        message: `Thank you, ${clientName}! Your ${numericRating}-star review has been saved successfully.`,
        data: newEntry
    });
});

app.listen(PORT, () => {
    console.log(`Server is running Advanced Mode on http://localhost:${PORT}`);
});