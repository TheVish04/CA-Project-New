const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/authMiddleware'); // Import authMiddleware for protected routes
require('dotenv').config();

router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Login attempt:', { username, email });

    // Validate input
    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username: username || '' },
          { email: email || '' },
        ],
      },
    });

    if (!user) {
      console.log('User not found:', { username, email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    console.log('Login successful for user:', {
      username: user.username,
      role: user.role,
      token: token.substring(0, 50) + '...', // Log partial token for security
    });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists', 
        details: existingUser.username === username ? 'Username already in use' : 'Email already in use'
      });
    }

    // Hash password and create user with role 'user'
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user', // Only users can register
    });

    console.log('User registered successfully:', {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// Protected route to get current user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role'], // Exclude sensitive fields like password
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in /me route:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to fetch user info', details: error.message });
  }
});

module.exports = router;