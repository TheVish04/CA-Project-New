const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/authMiddleware'); // Import authMiddleware for protected routes
require('dotenv').config();

// In login route:
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password presence
    if (!password || password.trim().length < 1) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user by email only
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token (moved inside the route handler)
    const token = jwt.sign(
      { id: user.id, role: user.role, fullName: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({ token });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate inputs
    const sanitizedName = (fullName || '').trim();
    const sanitizedEmail = (email || '').trim().toLowerCase();

    // Name validation
    if (!sanitizedName || sanitizedName.length < 3) {
      return res.status(400).json({ 
        error: 'Full name must be at least 3 characters',
        field: 'fullName'
      });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return res.status(400).json({
        error: 'Invalid email format',
        field: 'email'
      });
    }

    // Password validation
    if (!password || password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
        field: 'password'
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({  // Proper conflict status
        error: 'Email already registered',
        redirect: '/login'
      });
    }

    // Secure password hashing
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await User.create({
      fullName: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      role: 'user'
    });

    // Return success response
    res.status(201).json({ 
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// In /me route
router.get('/me', authMiddleware, async (req, res) => {
try {
// Add proper error handling for missing user
if (!req.user?.id) {
return res.status(401).json({ error: 'Invalid authentication' });
}

const user = await User.findByPk(req.user.id, {
attributes: ['id', 'fullName', 'email', 'role', 'createdAt'] // Add createdAt
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