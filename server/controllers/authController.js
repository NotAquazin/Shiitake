const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (User) => {
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
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      // 3. Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 4. Insert into database
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword
      });

      // 5. Return success response
      return res.status(201).json({
        message: 'User registered successfully.',
        user: { id: newUser.id, username: newUser.username, email: newUser.email }
      });

    } catch (error) {
      console.error('Error in registerUser:', error);
      return res.status(500).json({ error: 'An unexpected error occurred during registration. Please try again later.' });
    }
  };

  const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password.' });
      }

      // 1. Query users table by email
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // 2. Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // 3. Generate JWT
      const token = jwt.sign(
        { user_id: user.id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      // 4. Return success response
      return res.status(200).json({
        message: 'Login successful.',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });

    } catch (error) {
      console.error('Error in loginUser:', error);
      return res.status(500).json({ error: 'An unexpected error occurred during login. Please try again later.' });
    }
  };

  return { registerUser, loginUser };
};
