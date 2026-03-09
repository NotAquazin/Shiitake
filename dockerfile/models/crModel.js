const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CR = sequelize.define('CR', {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },

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

        averageRating: { 
            type: DataTypes.FLOAT, 
            defaultValue: 0.0 
        },

        tags: { 
            type: DataTypes.JSONB, 
            defaultValue: [] 
        },

        status: { 
            type: DataTypes.ENUM('available', 'under maintenance', 'closed'), 
            defaultValue: 'available' 
        }

    }, {
        timestamps: true
    });

    return CR;
};