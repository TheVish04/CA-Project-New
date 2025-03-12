const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Login attempt:', { username, email });

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    console.log('Login successful for user:', user.username);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// New registration endpoint for users only
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

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
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    // Hash password and create user with role 'user'
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user', // Only users can register
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

module.exports = router;