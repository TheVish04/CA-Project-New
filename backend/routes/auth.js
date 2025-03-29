const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateOTP, verifyOTP, sendOTPEmail } = require('../services/otpService');
require('dotenv').config();

// Rate limiting for login attempts
const loginAttempts = new Map();

// Cleanup expired login attempts every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (now > data.resetTime) {
      loginAttempts.delete(key);
    }
  }
}, 15 * 60 * 1000);

// Helper function to track login attempts
function updateLoginAttempts(key, success) {
  const now = Date.now();
  const data = loginAttempts.get(key) || { 
    attempts: 0, 
    resetTime: now + 15 * 60 * 1000, // Reset after 15 minutes
    blocked: false
  };
  
  if (success) {
    // On successful login, reset attempts
    loginAttempts.delete(key);
    return;
  }
  
  // Increment failed attempts
  data.attempts += 1;
  
  // Block after 5 failed attempts
  if (data.attempts >= 5) {
    data.blocked = true;
    data.resetTime = now + 15 * 60 * 1000; // Block for 15 minutes
  }
  
  loginAttempts.set(key, data);
}

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

    // Implement rate limiting
    const clientIP = req.ip || 'unknown';
    const loginKey = `${email.toLowerCase()}:${clientIP}`;
    const now = Date.now();
    
    // Check if this IP+email combo is already blocked
    const attemptData = loginAttempts.get(loginKey);
    if (attemptData && attemptData.blocked && now < attemptData.resetTime) {
      const waitMinutes = Math.ceil((attemptData.resetTime - now) / (60 * 1000));
      return res.status(429).json({ 
        error: `Too many failed login attempts. Please try again in ${waitMinutes} minutes.`
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Add small delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));

    if (!user) {
      // Update failed attempts for this IP and email combination
      updateLoginAttempts(loginKey, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Update failed attempts counter
      updateLoginAttempts(loginKey, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts on successful login
    updateLoginAttempts(loginKey, true);

    // Create JWT token
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

    // Enhanced password validation
    if (!password) {
      return res.status(400).json({
        error: 'Password is required',
        field: 'password'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        field: 'password'
      });
    }
    
    // Check password strength (at least 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
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