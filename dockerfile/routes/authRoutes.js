const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Export a function that accepts the User model
module.exports = (User) => {
    // Pass the User model into the controller functions using a wrapper
    router.post('/register', (req, res) => registerUser(req, res, User));
    router.post('/login', (req, res) => loginUser(req, res, User));

    return router;
};
