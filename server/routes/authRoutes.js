const express = require('express');

module.exports = (User) => {
  const router = express.Router();
  const { registerUser, loginUser } = require('../controllers/authController')(User);

  router.post('/register', registerUser);
  router.post('/login', loginUser);

  return router;
};
