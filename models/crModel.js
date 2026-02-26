const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CR = sequelize.define('CR', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // e.g., "MVP 1st Floor Men's"
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    building: {
        type: DataTypes.STRING,
        allowNull: false
    },
    floor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // For the "Quick View" and Leaderboard
    averageRating: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    // Tags like ["Bidet", "Vending Machine", "Spacious"]
    tags: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Requirement 4.4: Track if it's currently under maintenance
    status: {
        type: DataTypes.ENUM('available', 'under maintenance', 'closed'),
        defaultValue: 'available'
    }
}, {
    timestamps: true
});

module.exports = CR;