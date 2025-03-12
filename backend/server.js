const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/User');
const Question = require('./models/Question');
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const { authMiddleware, adminMiddleware } = require('./middleware/authMiddleware');
const cors = require('cors');
const path = require('path'); // Added missing import
const fs = require('fs'); // Added for database folder creation
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// Create database folder if it doesn't exist
const dbFolder = path.join(__dirname, 'database');
if (!fs.existsSync(dbFolder)) {
  console.log('Creating database folder:', dbFolder);
  fs.mkdirSync(dbFolder, { recursive: true });
}

// Middleware
app.use(express.json());

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Use environment variable or default
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies or authorization headers if needed
};
app.use(cors(corsOptions));

// Authentication routes
app.use('/api/auth', authRoutes);

// Question routes
app.use('/api/questions', questionRoutes);

// Example protected admin route
app.get('/api/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Welcome to the admin panel' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Initialize database and create default admin if none exists
const initializeDatabase = async () => {
  try {
    // Sync database without dropping tables
    await sequelize.sync({ force: false });
    console.log('Database synced successfully (force: false)');

    // Verify database connection by fetching table info
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables in database:', tables);

    // Check if an admin user exists, create one if not
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const defaultAdmin = await User.create({
        username: 'admin',
        password: 'admin123', // In production, use a secure password and hash it
        email: 'admin@example.com',
        role: 'admin',
      });
      console.log('Default admin created:', defaultAdmin.username);
    } else {
      console.log('Admin user already exists, skipping creation.');
    }

    // Log total number of questions for debugging
    const questionCount = await Question.count();
    console.log(`Total questions in database: ${questionCount}`);
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err; // Rethrow to stop server if database initialization fails
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
    console.error('Failed to start server due to database error:', err);
    process.exit(1); // Exit with failure code
  });