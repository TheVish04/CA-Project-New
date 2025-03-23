const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paperType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  examStage: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paperNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  questionNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answerText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pageNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subQuestions: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});

module.exports = Question; // Ensure this exports the Question model object