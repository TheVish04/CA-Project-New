const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const Question = require('../models/Question');
const Joi = require('joi');

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
    .pattern(/^\d+$/)
    .message('Page number must be a valid number'),
  subQuestions: Joi.array()
    .optional()
    .items(
      Joi.object({
        subQuestionNumber: Joi.string().allow('').optional(),
        subQuestionText: Joi.string().allow('').optional(),
        subOptions: Joi.array()
          .optional()
          .items(
            Joi.object({
              optionText: Joi.string().allow('').optional(),
              isCorrect: Joi.boolean().default(false),
            })
          ),
      })
    ),
});

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

    const dataToValidate = {
      subject,
      examType,
      year,
      month,
      group,
      paperName,
      questionNumber,
      questionText,
      answerText: answerText || '',
      pageNumber,
      subQuestions: subQuestions || [],
    };

    console.log('Data to validate:', dataToValidate);

    const { error } = questionSchema.validate(dataToValidate, { abortEarly: false });
    if (error) {
      console.log('Validation errors:', error.details);
      return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
    }

    const questionData = {
      subject,
      examType,
      year,
      month,
      group,
      paperName,
      questionNumber,
      questionText,
      answerText: answerText || '',
      pageNumber,
      subQuestions: dataToValidate.subQuestions,
    };

    const question = await Question.create(questionData);
    console.log('Question created with ID:', question.id);
    res.status(201).json({ id: question.id, ...questionData });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: `Failed to create question: ${error.message}` });
  }
});

router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating question with ID:', id, 'Received data:', req.body);

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
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const dataToValidate = {
      subject: subject || question.subject,
      examType: examType || question.examType,
      year: year || question.year,
      month: month || question.month,
      group: group || question.group,
      paperName: paperName || question.paperName,
      questionNumber: questionNumber || question.questionNumber,
      questionText: questionText || question.questionText,
      answerText: answerText || question.answerText || '',
      pageNumber: pageNumber || question.pageNumber,
      subQuestions: subQuestions || question.subQuestions || [],
    };

    const { error } = questionSchema.validate(dataToValidate, { abortEarly: false });
    if (error) {
      console.log('Validation errors on update:', error.details);
      return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
    }

    const updatedData = {
      subject: dataToValidate.subject,
      examType: dataToValidate.examType,
      year: dataToValidate.year,
      month: dataToValidate.month,
      group: dataToValidate.group,
      paperName: dataToValidate.paperName,
      questionNumber: dataToValidate.questionNumber,
      questionText: dataToValidate.questionText,
      answerText: dataToValidate.answerText,
      pageNumber: dataToValidate.pageNumber,
      subQuestions: dataToValidate.subQuestions,
    };

    await question.update(updatedData);
    console.log('Question updated successfully for ID:', id);
    res.json({ message: 'Question updated successfully', id, ...updatedData });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: `Failed to update question: ${error.message}` });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { subject, year, questionNumber } = req.query;
    const where = {};
    if (subject) where.subject = subject;
    if (year) where.year = year;
    if (questionNumber) where.questionNumber = questionNumber;

    const questions = await Question.findAll({ where });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: `Failed to fetch questions: ${error.message}` });
  }
});

router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    await question.destroy();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: `Failed to delete question: ${error.message}` });
  }
});

module.exports = router;