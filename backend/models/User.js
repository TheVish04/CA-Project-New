const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

console.log('Defining User model...');
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
});

console.log('User model defined:', User);
module.exports = User; // Correct: Export the User model object