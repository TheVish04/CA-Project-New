const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/User');
const Question = require('./models/Question');
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const { authMiddleware, adminMiddleware } = require('./middleware/authMiddleware');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const bcrypt = require('bcrypt');

const app = express();

// Create database folder if it doesn't exist
const dbFolder = path.join(__dirname, 'database');
if (!fs.existsSync(dbFolder)) {
  console.log('Creating database folder:', dbFolder);
  fs.mkdirSync(dbFolder, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '10mb' }));

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:5173'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Authentication routes
app.use('/api/auth', authRoutes);

// Question routes
app.use('/api/questions', questionRoutes);

// Example protected admin route
app.get('/api/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Welcome to the admin panel', user: req.user.username });
});

// Health check endpoint with detailed status
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    dbConnected: sequelize.connectionManager.hasActiveConnection(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
  res.status(200).json(health);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', {
    stack: err.stack,
    message: err.message,
    status: err.status || 500,
  });
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: err.message || 'Internal server error',
  });
});

// Initialize database and create default admin if none exists
const initializeDatabase = async () => {
  try {
    // Sync database without dropping tables, with logging
    await sequelize.sync({ force: false, logging: (msg) => console.log('Database sync:', msg) });
    console.log('Database synced successfully (force: false)');

    // Verify database connection by fetching table info
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables in database:', tables);

    // Check if an admin user exists, create one if not
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const defaultAdmin = await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Default admin created:', {
        username: defaultAdmin.username,
        email: defaultAdmin.email,
        password: adminPassword, // Log the plaintext password for debugging (remove in production)
      });
    } else {
      console.log('Admin user already exists, skipping creation.');
      const existingAdmin = await User.findOne({ where: { role: 'admin' } });
      console.log('Existing admin details:', {
        username: existingAdmin.username,
        email: existingAdmin.email,
        passwordHash: existingAdmin.password, // Log the hashed password for debugging
      });
    }

    // Log total number of questions for debugging
    const questionCount = await Question.count();
    console.log(`Total questions in database: ${questionCount}`);
  } catch (err) {
    console.error('Error initializing database:', {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
};

// Start server only if database initialization succeeds
const PORT = process.env.PORT || 5000;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to database error:', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

module.exports = app;