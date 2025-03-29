const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const authMiddleware = async (req, res, next) => {
  // Check for authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  // Verify token format and extract it
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token format should be: Bearer [token]' });
  }

  const token = parts[1];

  try {
    // Verify token with proper error handling
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    } else {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
};

module.exports = { authMiddleware, adminMiddleware };