require('dotenv').config();
const express = require('express');
const path = require('path');
const sequelize = require('./config/database');

// Import Models
const User = require('./models/userModel');
const CR = require('./models/crModel');
const Review = require('./models/reviewModel');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Associations
User.hasMany(Review);
Review.belongsTo(User);
CR.hasMany(Review);
Review.belongsTo(CR);

const authRoutes = require('./server/routes/authRoutes');

// Routes
app.use('/api/auth', authRoutes);

// API Route to get all CRs from the database
app.get('/api/crs', async (req, res) => {
    try {
        const crs = await CR.findAll({
            include: [Review] 
        });
        res.json(crs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// Any other requests not handled by API routes will be caught here and sent to the React app
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server and sync DB
const startApp = async () => {
    try {
        // Sync database first, then start listening for requests
        // NOTE: Commented out because Supabase's transaction pooler (port 6543) does not support DDL operations like alter/sync and will hang forever.
        // await sequelize.sync({ alter: true });
        // console.log("✅ Database synced successfully!");

        app.listen(PORT, () => {
            console.log(`🚀 Shiitake server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Error starting the app:", error);
    }
};

startApp();