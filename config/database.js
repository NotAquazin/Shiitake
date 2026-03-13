const { Sequelize } = require('sequelize');

// 1st parameter is db i initialized in pgAdmin4
// 3rd parameter is jst the password i set lmfao
const sequelize = new Sequelize('shiitake', 'postgres', 'october272004', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false, // Keeps the terminal clean
});

module.exports = sequelize;