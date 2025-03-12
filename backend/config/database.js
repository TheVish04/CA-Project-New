const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || {
  dialect: 'sqlite',
  storage: process.env.DATABASE_STORAGE || './database/database.sqlite',
});

module.exports = sequelize;