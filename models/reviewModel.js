const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Review = sequelize.define('Review', {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, primaryKey: true 
        },

        author: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Anonymous'
        },

        rating: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            validate: { min: 1, max: 5 } 
        },

        comment: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },

        reviewTags: { 
            type: DataTypes.JSONB, 
            defaultValue: [] 
        },

        likes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        dislikes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        reported: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }

    }, {
        timestamps: true
    });

    return Review;
};