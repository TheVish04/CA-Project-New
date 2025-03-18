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

// Initialize database and models before setting up routes
const initializeDatabase = async () => {
  try {
    // Test the Sequelize connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Verify User model
    if (!User) {
      console.error('User model is undefined. Import path or file issue:', {
        filePath: './models/User',
        cwd: process.cwd(),
      });
      throw new Error('User model not loaded');
    }
    if (typeof User.findOne !== 'function') {
      console.error('User model lacks findOne method:', User);
      throw new Error('User model not initialized');
    }
    console.log('User model loaded successfully:', User);

    // Verify Question model
    if (!Question) {
      console.error('Question model is undefined. Import path or file issue:', {
        filePath: './models/Question',
        cwd: process.cwd(),
      });
      throw new Error('Question model not loaded');
    }
    if (typeof Question.findOne !== 'function') {
      console.error('Question model lacks findOne method:', Question);
      throw new Error('Question model not initialized');
    }
    console.log('Question model loaded successfully:', Question);

    // Sync database without dropping tables, with logging
    await sequelize.sync({ force: false, logging: (msg) => console.log('Database sync:', msg) });
    console.log('Database synced successfully (force: false)');

    // Verify database connection by fetching table info
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables in database:', tables);

    // Check if an admin user exists, create one if not
    await checkAndCreateAdmin();

    // Log total number of users for debugging
    const userCount = await User.count();
    console.log(`Total users in database: ${userCount}`);

    // Log total number of questions for debugging
    const questionCount = await Question.count();
    console.log(`Total questions in database: ${questionCount}`);

    // Set up routes after successful initialization
    app.use('/api/auth', authRoutes);
    app.use('/api/questions', questionRoutes);
  } catch (err) {
    console.error('Error initializing database or models:', {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
};

// Separate function to check and create admin user
const checkAndCreateAdmin = async () => {
  try {
    const adminCount = await User.count({ 
      where: { role: 'admin' } 
    });

    if (adminCount === 0) {
      // Validate admin credentials from env
      const adminFullName = process.env.ADMIN_FULL_NAME || 'Admin User';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        throw new Error('Invalid admin email format');
      }
      if (!adminPassword || adminPassword.length < 6) {
        throw new Error('Admin password must be at least 6 characters long');
      }

      const admin = await User.create({
        fullName: adminFullName,
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        role: 'admin'
      });
      console.log('Admin user created:', {
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      });
    } else {
      console.log('Admin user already exists, skipping creation.');
      const existingAdmin = await User.findOne({ where: { role: 'admin' } });
      console.log('Existing admin details:', {
        fullName: existingAdmin.fullName,
        email: existingAdmin.email,
        role: existingAdmin.role,
      });
    }
  } catch (error) {
    console.error('Admin initialization error:', error);
    throw error;
  }
};

// Example protected admin route
app.get('/api/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Welcome to the admin panel', user: req.user.username, role: req.user.role });
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
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: err.message || 'Internal server error',
  });
});

// Start server only if database and models initialize successfully
const PORT = process.env.PORT || 5000;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to initialization error:', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

module.exports = app;