const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME || 'examdb', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'sqlite',
  storage: './database/questions.db',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

module.exports = sequelize;
