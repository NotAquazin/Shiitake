require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false, // Keeps the terminal clean
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // This is required for Supabase connections
        }
    }
});

module.exports = sequelize;