const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const GlobalTag = sequelize.define('GlobalTag', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }, {
        timestamps: false,
    });

    return GlobalTag;
};
