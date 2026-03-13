const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Sequelize } = require('sequelize');

console.log('Dotenv Load Result:', dotenvResult.error ? dotenvResult.error.message : 'Success');
console.log('DATABASE_URL is defined:', !!process.env.DATABASE_URL);

let sequelize;
try {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false, // Keeps the terminal clean
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // This is required for Supabase connections
            }
        }
    });
} catch (error) {
    console.error('FATAL ERROR initializing Sequelize:', error.message);
    process.exit(1);
}

module.exports = sequelize;