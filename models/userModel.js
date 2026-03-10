const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Your DB connection file

const User = sequelize.define('User', {
    // Primary Key
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Required for User Profiles 
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // Required for Login & Authentication 
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Profile Bio 
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Differentiates Admin vs standard Atenean user 
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    // Stores earned badges (e.g., Bronze, Silver) [cite: 541, 545]
    badges: {
        type: DataTypes.JSONB, // PostgreSQL specific for storing arrays/objects
        defaultValue: []
    },
    // List of saved favorite restrooms 
    favoriteCRs: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    timestamps: true // Tracks when user joined
});

module.exports = User;

