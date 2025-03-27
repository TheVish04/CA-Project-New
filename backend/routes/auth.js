const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateOTP, verifyOTP, sendOTPEmail } = require('../services/otpService');
require('dotenv').config();

// Send OTP for registration
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email format and ensure it's a Gmail address
    if (!email || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid Gmail address',
        field: 'email'
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered',
        redirect: '/login'
      });
    }
    
    // Generate OTP
    const otp = generateOTP(email);
    
    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        error: 'Failed to send OTP email',
        details: emailResult.error
      });
    }
    
    res.json({ 
      message: 'OTP sent successfully',
      email
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    const verification = verifyOTP(email, otp);
    
    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }
    
    res.json({ 
      message: verification.message,
      verified: true,
      email
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

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
    const user = await User.findOne({ email: email.trim().toLowerCase() });

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
    const { fullName, email, password, verifiedEmail } = req.body;

    // Ensure email was verified
    if (email !== verifiedEmail) {
      return res.status(400).json({ 
        error: 'Email verification required',
        redirect: '/register'
      });
    }

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
    const existingUser = await User.findOne({ email: sanitizedEmail });

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

const user = await User.findById(req.user.id).select('id fullName email role createdAt');

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