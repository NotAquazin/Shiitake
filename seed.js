const sequelize = require('./config/database');
const User = require('./models/userModel');
const CR = require('./models/crModel');
const Review = require('./models/reviewModel');

// --- THE ASSOCIATIONS (Must be here too!) ---
User.hasMany(Review);
Review.belongsTo(User);
CR.hasMany(Review);
Review.belongsTo(CR);

async function seed() {
    try {
        console.log("1. Connecting to DB...");
        await sequelize.sync({ force: true });
        
        console.log("2. Creating User...");
        const admin = await User.create({
            username: 'AteneoAdmin',
            email: 'admin@ateneo.edu',
            password: 'password123'
        });

        console.log("3. Creating CR...");
        const mvpCR = await CR.create({
            name: "MVP 1st Floor Men's",
            building: "MVP",
            floor: 1,
            latitude: 14.639,
            longitude: 121.077,
            tags: ["Bidet", "Clean"]
        });

        console.log("4. Creating Review linked to CR ID:", mvpCR.id);
        await Review.create({
            rating: 5,
            comment: "Best bidet in Ateneo! Very clean.",
            CRId: mvpCR.id,
            UserId: admin.id
        });

        console.log("🌱 Database seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ CRITICAL ERROR DURING SEEDING:");
        console.error(err);
        process.exit(1);
    }
}

seed();