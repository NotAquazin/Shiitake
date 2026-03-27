const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, primaryKey: true 
        },

        username: { 
            type: DataTypes.STRING, 
            allowNull: false, unique: true 
        },

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

        description: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },

        role: { 
            type: DataTypes.ENUM('user', 'admin'), 
            defaultValue: 'user' 
        },

        badges: { 
            type: DataTypes.JSONB, 
            defaultValue: [] 
        },
            
        favoriteCRs: { 
            type: DataTypes.JSONB, 
            defaultValue: [] 
        }
    }, {
        timestamps: true
    });

    return User;
};
