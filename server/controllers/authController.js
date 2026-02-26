const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db'); // Assuming the db pool is exported from db/index.js

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Input Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email, and password.' });
    }

    // Email validation: must end with @student.ateneo.edu or @ateneo.edu
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(student\.ateneo\.edu|ateneo\.edu)$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please use a valid Ateneo email address.' });
    }

    // Username validation: max 20 alphanumeric characters
    const usernameRegex = /^[a-zA-Z0-9]{1,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username must be 1-20 alphanumeric characters with no spaces or special characters.' });
    }

    // Password validation: at least 8 characters
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // 2. Check if email already exists
    const emailCheckQuery = 'SELECT email FROM users WHERE email = $1';
    const existingUser = await db.query(emailCheckQuery, [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // 3. Generate user_id and hash password
    const user_id = crypto.randomUUID();
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 4. Insert into database
    const insertUserQuery = `
      INSERT INTO users (user_id, username, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, username, email, failed_login_attempts;
    `;
    
    const newUser = await db.query(insertUserQuery, [user_id, username, email, password_hash]);

    // 5. Return success response
    return res.status(201).json({
      message: 'User registered successfully.',
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({ error: 'An unexpected error occurred during registration. Please try again later.' });
  }
};

module.exports = {
  registerUser,
};
