const express = require('express');
const path = require('path');
const sequelize = require('./config/database');

// Import Models
const User = require('./models/userModel');
const CR = require('./models/crModel');
const Review = require('./models/reviewModel');

const app = express();
const PORT = 3000;

// --- 1. THE ASSOCIATIONS (The "Bridge") ---
User.hasMany(Review);
Review.belongsTo(User);
CR.hasMany(Review);
Review.belongsTo(CR);

// --- 2. ROUTES ---

// Serve the static HTML file when someone visits http://localhost:3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Route to get all CRs from the database
app.get('/api/crs', async (req, res) => {
    try {
        // "include" tells Sequelize to join the Review table
        const crs = await CR.findAll({
            include: [Review] 
        });
        res.json(crs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 3. START SERVER & SYNC DB ---
const startApp = async () => {
    try {
        // Sync database first, then start listening for requests
        await sequelize.sync({ alter: true });
        console.log("✅ Database synced successfully!");

        app.listen(PORT, () => {
            console.log(`🚀 Shiitake server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Error starting the app:", error);
    }
};

startApp();