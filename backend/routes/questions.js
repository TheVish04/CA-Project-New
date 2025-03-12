const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const Question = require('../models/Question');
const Joi = require('joi');

// Joi schema for question validation
const questionSchema = Joi.object({
  subject: Joi.string()
    .required()
    .valid(
      'Advanced Accounting',
      'Corporate Laws',
      'Taxation',
      'Cost & Management',
      'Auditing',
      'Financial Management'
    ),
  examType: Joi.string().required().valid('MTP', 'RTP'),
  year: Joi.string().required().valid('2024', '2023', '2022'),
  month: Joi.string().required().valid('March', 'February'),
  group: Joi.string().required().valid('Group I', 'Group II'),
  paperName: Joi.string()
    .required()
    .valid('Paper 01', 'Paper 02', 'Paper 03', 'Paper 04', 'Paper 05', 'Paper 06'),
  questionNumber: Joi.string().required(),
  questionText: Joi.string().required(),
  answerText: Joi.string().allow('').optional(),
  pageNumber: Joi.string()
    .required()
    .pattern(/^[0-9]+$/)
    .message('Page number must be a valid number'),
  subQuestions: Joi.array()
    .optional()
    .items(
      Joi.object({
        subQuestionNumber: Joi.string().allow('').optional(),
        subQuestionText: Joi.string().required(),
        subOptions: Joi.array()
          .optional()
          .items(
            Joi.object({
              optionText: Joi.string().required(),
              isCorrect: Joi.boolean().default(false),
            })
          ),
      })
    ),
});

// POST route (admin only)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('Received question data (raw):', req.body);

    const {
      subject,
      examType,
      year,
      month,
      group,
      paperName,
      questionNumber,
      questionText,
      answerText,
      pageNumber,
      subQuestions,
    } = req.body;

    // Normalize subject to match validation (Title Case)
    const normalizedSubject = subject
      ? subject
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      : 'Advanced Accounting'; // Fallback to a valid default

    // Ensure all required fields have fallbacks
    const normalizedExamType = examType || 'MTP';
    const normalizedYear = year || '2024';
    const normalizedMonth = month || 'March';
    const normalizedGroup = group || 'Group I';
    const normalizedPaperName = paperName || 'Paper 01';
    const normalizedQuestionNumber = questionNumber || '1';
    const normalizedQuestionText = questionText || 'Default question text';
    const normalizedPageNumber = pageNumber || '1';

    // Safely parse subQuestions (handle both string and array cases)
    let parsedSubQuestions = [];
    if (subQuestions) {
      if (typeof subQuestions === 'string') {
        try {
          parsedSubQuestions = JSON.parse(subQuestions);
        } catch (parseError) {
          console.error('Error parsing subQuestions:', parseError);
          return res.status(400).json({ error: 'Invalid subQuestions JSON format' });
        }
      } else if (Array.isArray(subQuestions)) {
        parsedSubQuestions = subQuestions;
      } else {
        return res.status(400).json({ error: 'subQuestions must be a JSON string or an array' });
      }
    }

    // Prepare data for validation
    const dataToValidate = {
      subject: normalizedSubject,
      examType: normalizedExamType,
      year: normalizedYear,
      month: normalizedMonth,
      group: normalizedGroup,
      paperName: normalizedPaperName,
      questionNumber: normalizedQuestionNumber,
      questionText: normalizedQuestionText,
      answerText: answerText || '',
      pageNumber: normalizedPageNumber,
      subQuestions: parsedSubQuestions,
    };

    console.log('Data to validate:', dataToValidate);

    // Validate input
    const { error } = questionSchema.validate(dataToValidate);
    if (error) {
      console.log('Validation error:', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    const questionData = {
      subject: normalizedSubject,
      examType: normalizedExamType,
      year: normalizedYear,
      month: normalizedMonth,
      group: normalizedGroup,
      paperName: normalizedPaperName,
      questionNumber: normalizedQuestionNumber,
      questionText: normalizedQuestionText,
      answerText: answerText || '',
      pageNumber: normalizedPageNumber,
      subQuestions: parsedSubQuestions,
    };

    const question = await Question.create(questionData);
    console.log('Question created with ID:', question.id);
    res.status(201).json({ id: question.id });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: `Failed to create question: ${error.message}` });
  }
});

// GET route with authentication and filtering (all authenticated users)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { subject, year, questionNumber } = req.query;
    const where = {};
    if (subject) where.subject = subject;
    if (year) where.year = year;
    if (questionNumber) where.questionNumber = questionNumber;

    console.log('Fetching questions with filters:', where);
    const questions = await Question.findAll({ where });
    console.log('Fetched questions:', questions);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: `Failed to fetch questions: ${error.message}` });
  }
});

// PUT route to update a question (admin only)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating question with ID:', id);
    console.log('Received update data:', req.body);

    const {
      subject,
      examType,
      year,
      month,
      group,
      paperName,
      questionNumber,
      questionText,
      answerText,
      pageNumber,
      subQuestions,
    } = req.body;

    const question = await Question.findByPk(id);
    if (!question) {
      console.log('Question not found for ID:', id);
      return res.status(404).json({ error: 'Question not found' });
    }

    // Normalize subject to match validation (Title Case)
    const normalizedSubject = subject
      ? subject
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      : '';

    // Ensure all required fields have fallbacks
    const normalizedExamType = examType || 'MTP';
    const normalizedYear = year || '2024';
    const normalizedMonth = month || 'March';
    const normalizedGroup = group || 'Group I';
    const normalizedPaperName = paperName || 'Paper 01';
    const normalizedQuestionNumber = questionNumber || '1';
    const normalizedQuestionText = questionText || 'Default question text';
    const normalizedPageNumber = pageNumber || '1';

    // Safely parse subQuestions (handle both string and array cases)
    let parsedSubQuestions = [];
    if (subQuestions) {
      if (typeof subQuestions === 'string') {
        try {
          parsedSubQuestions = JSON.parse(subQuestions);
        } catch (parseError) {
          console.error('Error parsing subQuestions:', parseError);
          return res.status(400).json({ error: 'Invalid subQuestions JSON format' });
        }
      } else if (Array.isArray(subQuestions)) {
        parsedSubQuestions = subQuestions;
      } else {
        return res.status(400).json({ error: 'subQuestions must be a JSON string or an array' });
      }
    }

    // Prepare data for validation
    const dataToValidate = {
      subject: normalizedSubject,
      examType: normalizedExamType,
      year: normalizedYear,
      month: normalizedMonth,
      group: normalizedGroup,
      paperName: normalizedPaperName,
      questionNumber: normalizedQuestionNumber,
      questionText: normalizedQuestionText,
      answerText: answerText || '',
      pageNumber: normalizedPageNumber,
      subQuestions: parsedSubQuestions,
    };

    console.log('Data to validate for update:', dataToValidate);

    // Validate input
    const { error } = questionSchema.validate(dataToValidate);
    if (error) {
      console.log('Validation error on update:', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedData = {
      subject: normalizedSubject,
      examType: normalizedExamType,
      year: normalizedYear,
      month: normalizedMonth,
      group: normalizedGroup,
      paperName: normalizedPaperName,
      questionNumber: normalizedQuestionNumber,
      questionText: normalizedQuestionText,
      answerText: answerText || '',
      pageNumber: normalizedPageNumber,
      subQuestions: parsedSubQuestions,
    };

    await question.update(updatedData);
    console.log('Question updated successfully for ID:', id);
    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: `Failed to update question: ${error.message}` });
  }
});

// DELETE route to delete a question (admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting question with ID:', id);

    const question = await Question.findByPk(id);
    if (!question) {
      console.log('Question not found for ID:', id);
      return res.status(404).json({ error: 'Question not found' });
    }

    await question.destroy();
    console.log('Question deleted successfully for ID:', id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: `Failed to delete question: ${error.message}` });
  }
});

module.exports = router;