const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const Question = require('../models/QuestionModel');
const Joi = require('joi');

const questionSchema = Joi.object({
  subject: Joi.string()
    .required()
    .when('examStage', {
      is: 'Foundation',
      then: Joi.string().valid(
        'Principles and Practices of Accounting',
        'Business Law',
        'Business Correspondence and Reporting',
        'Business Mathematics',
        'Logical Reasoning',
        'Statistics',
        'Business Economics',
        'Business and Commercial Knowledge'
      ),
      otherwise: Joi.string().when('examStage', {
        is: 'Intermediate',
        then: Joi.string().valid(
          'Advanced Accounting',
          'Corporate Laws',
          'Cost and Management Accounting',
          'Taxation',
          'Auditing and Code of Ethics',
          'Financial and Strategic Management'
        ),
        otherwise: Joi.string().valid(
          'Financial Reporting',
          'Advanced Financial Management',
          'Advanced Auditing',
          'Direct and International Tax Laws',
          'Indirect Tax Laws',
          'Integrated Business Solutions'
        )
      })
    }),
  paperType: Joi.string().required().valid('MTP', 'RTP', 'PYQS'),
  year: Joi.string().required().valid('2024', '2023', '2022'),
  month: Joi.string().required().valid(
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ),
  examStage: Joi.string().required().valid('Foundation', 'Intermediate', 'Final'),
  paperNo: Joi.string()
    .when('examStage', {
      is: 'Foundation',
      then: Joi.string().required().valid('Paper 1', 'Paper 2', 'Paper 3', 'Paper 4'),
      otherwise: Joi.string().optional().allow('')
    }),
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
      paperType,
      year,
      month,
      examStage,
      paperNo,
      questionNumber,
      questionText,
      answerText,
      pageNumber,
      subQuestions,
    } = req.body;

    const dataToValidate = {
      subject,
      paperType,
      year,
      month,
      examStage,
      paperNo,
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
      paperType,
      year,
      month,
      examStage,
      paperNo,
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
      paperType,
      year,
      month,
      examStage,
      paperNo,
      questionNumber,
      questionText,
      answerText,
      pageNumber,
      subQuestions,
    } = req.body;

    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const dataToValidate = {
      subject: subject || question.subject,
      paperType: paperType || question.paperType,
      year: year || question.year,
      month: month || question.month,
      examStage: examStage || question.examStage,
      paperNo: paperNo || question.paperNo,
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
      paperType: dataToValidate.paperType,
      year: dataToValidate.year,
      month: dataToValidate.month,
      examStage: dataToValidate.examStage,
      paperNo: dataToValidate.paperNo,
      questionNumber: dataToValidate.questionNumber,
      questionText: dataToValidate.questionText,
      answerText: dataToValidate.answerText,
      pageNumber: dataToValidate.pageNumber,
      subQuestions: dataToValidate.subQuestions,
    };

    await Question.findByIdAndUpdate(id, updatedData, { new: true });
    console.log('Question updated successfully for ID:', id);
    res.json({ message: 'Question updated successfully', id, ...updatedData });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: `Failed to update question: ${error.message}` });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { subject, year, questionNumber, paperType, month, examStage, paperNo, search } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (year) filter.year = year;
    if (questionNumber) filter.questionNumber = questionNumber;
    if (paperType) filter.paperType = paperType;
    if (month) filter.month = month;
    if (examStage) filter.examStage = examStage;
    if (paperNo) filter.paperNo = paperNo;
    
    // Handle search keyword (case-insensitive)
    if (search) {
      filter.questionText = {
        $regex: search,
        $options: 'i'
      };
    }

    const questions = await Question.find(filter);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: `Failed to fetch questions: ${error.message}` });
  }
});

router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    await Question.findByIdAndDelete(id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;