const sequelize = require('./config/database');
sequelize.authenticate()
  .then(() => console.log('Database connection successful'))
  .catch(err => console.error('Database connection failed:', err));