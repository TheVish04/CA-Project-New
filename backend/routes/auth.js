const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize'); // Import Sequelize for Sequelize.Op
const { User } = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Login attempt:', { username, email }); // Debug log

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

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
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

module.exports = router;