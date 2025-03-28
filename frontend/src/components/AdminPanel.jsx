import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PreviewPanel from './PreviewPanel';
import Navbar from './Navbar';
import DOMPurify from 'dompurify';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    paperType: '',
    year: '',
    month: '',
    examStage: '',
    paperNo: '',
    questionNumber: '',
    questionText: '',
    answerText: '',
    pageNumber: '',
    subQuestions: [],
  });

  const [errors, setErrors] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [storedQuestions, setStoredQuestions] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  // Updated filters state with new criteria for advanced filtering & search
  const [filters, setFilters] = useState({
    subject: '',
    year: '',
    questionNumber: '',
    paperType: '',
    month: '',
    examStage: '',
    paperNo: '',
    search: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);

  // Pagination states (if needed later with infinite scroll)
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10; // For example, 10 per page

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    } else {
      applyFilters(token);
    }
  }, [navigate]);

  // Modified fetchQuestions with pagination (if needed) and applying all filters
  const fetchQuestions = async (token, query = '') => {
    try {
      const response = await fetch(`https://ca-project-new.onrender.com/api/questions${query ? `?${query}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Fetch response status:', response.status);
      console.log('Fetch response data:', data);
      if (response.ok) {
        const questions = Array.isArray(data) ? data : [data];
        console.log('Fetched questions with all fields:', questions);
        const sortedQuestions = questions.sort((a, b) => b.id - a.id);
        setStoredQuestions(sortedQuestions);
        if (lastSubmittedId && sortedQuestions.some(q => q.id === lastSubmittedId)) {
          resetForm();
          setLastSubmittedId(null);
        }
      } else {
        console.error('Failed to fetch questions:', response.statusText, data);
        alert(`Failed to fetch questions: ${response.statusText} - ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert(`Error fetching questions: ${error.message}`);
    }
  };

  // Build query string from filters (including new advanced ones)
  const applyFilters = (token) => {
    const query = new URLSearchParams(filters).toString();
    fetchQuestions(token, query);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const addSubQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      subQuestions: [
        ...prev.subQuestions,
        { subQuestionNumber: '', subQuestionText: '', subOptions: [{ optionText: '', isCorrect: false }] },
      ],
    }));
  };

  const removeSubQuestion = (index) => {
    console.log('Removing subquestion at index:', index);
    setFormData((prev) => {
      const updatedSubQuestions = prev.subQuestions.filter((_, i) => i !== index);
      console.log('Updated subQuestions:', updatedSubQuestions);
      return { ...prev, subQuestions: updatedSubQuestions };
    });
  };

  const handleSubQuestionChange = (index, field, value) => {
    const updated = [...formData.subQuestions];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, subQuestions: updated }));
    validateSubQuestion(index, field, value);
  };

  const addSubOption = (subIndex) => {
    const updated = [...formData.subQuestions];
    updated[subIndex].subOptions.push({ optionText: '', isCorrect: false });
    setFormData((prev) => ({ ...prev, subQuestions: updated }));
  };

  const removeSubOption = (subIndex, optionIndex) => {
    const updated = [...formData.subQuestions];
    if (updated[subIndex].subOptions.length > 1) {
      updated[subIndex].subOptions = updated[subIndex].subOptions.filter((_, i) => i !== optionIndex);
    }
    setFormData((prev) => ({ ...prev, subQuestions: updated }));
  };

  const handleSubOptionChange = (subIndex, optionIndex, e) => {
    const { name, value } = e.target;
    const updated = [...formData.subQuestions];
    updated[subIndex].subOptions[optionIndex][name] = value;
    setFormData((prev) => ({ ...prev, subQuestions: updated }));
    validateSubOption(subIndex, optionIndex, name, value);
  };

  const markCorrectSubOption = (subIndex, optionIndex) => {
    const updated = [...formData.subQuestions];
    updated[subIndex].subOptions = updated[subIndex].subOptions.map((opt, i) => ({
      ...opt,
      isCorrect: i === optionIndex,
    }));
    setFormData((prev) => ({ ...prev, subQuestions: updated }));
  };

  const handlePreview = () => {
    const validation = validateForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      alert('Please fix the validation errors before previewing.');
    } else {
      setPreviewVisible(true);
    }
  };

  const closePreview = () => {
    setPreviewVisible(false);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'subject':
        if (!value || value === '') error = 'Subject is required';
        break;
      case 'paperType':
        if (!value || value === '') error = 'Paper Type is required';
        break;
      case 'year':
        if (!value || value === '') error = 'Year is required';
        break;
      case 'month':
        if (!value || value === '') error = 'Month is required';
        break;
      case 'examStage':
        if (!value || value === '' || value === 'Select Exam Stage') error = 'Exam Stage is required';
        break;
      case 'paperNo':
        if (formData.examStage === 'Foundation' && (!value || value === '' || value === 'Select Paper')) {
          error = 'Paper No. is required for Foundation stage';
        }
        break;
      case 'questionNumber':
        if (!value) error = 'Question Number is required';
        break;
      case 'pageNumber':
        if (!value) error = 'Page Number is required';
        break;
      case 'questionText':
        if (!value) error = 'Question text is required';
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateSubQuestion = (index, field, value) => {
    let error = field === 'subQuestionText' && !value.trim() ? `Sub-question ${index + 1} text is required` : '';
    setErrors((prev) => ({ ...prev, [`subQuestion_${index}`]: error }));
  };

  const validateSubOption = (subIndex, optionIndex, name, value) => {
    let error = name === 'optionText' && !value.trim() ? `Sub-question ${subIndex + 1}, Option ${optionIndex + 1} text is required` : '';
    setErrors((prev) => ({ ...prev, [`subOption_${subIndex}_${optionIndex}`]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ['subject', 'paperType', 'year', 'month', 'examStage', 'questionNumber', 'questionText', 'pageNumber'];
    
    // Add paperNo to validation only if examStage is Foundation
    if (formData.examStage === 'Foundation') {
      fieldsToValidate.push('paperNo');
    }
    
    fieldsToValidate.forEach((field) => {
      validateField(field, formData[field]);
      if (errors[field]) newErrors[field] = errors[field];
    });
    formData.subQuestions.forEach((subQ, index) => {
      validateSubQuestion(index, 'subQuestionText', subQ.subQuestionText);
      if (errors[`subQuestion_${index}`]) newErrors[`subQuestion_${index}`] = errors[`subQuestion_${index}`];
      subQ.subOptions.forEach((opt, optIndex) => {
        validateSubOption(index, optIndex, 'optionText', opt.optionText);
        if (errors[`subOption_${index}_${optIndex}`]) newErrors[`subOption_${index}_${optIndex}`] = errors[`subOption_${index}_${optIndex}`];
      });
    });
    return newErrors;
  };

  const cleanSubQuestions = (subQuestions) => {
    return subQuestions.map((subQ) => ({
      subQuestionNumber: subQ.subQuestionNumber || '',
      subQuestionText: subQ.subQuestionText || '',
      subOptions: subQ.subOptions.map((opt) => ({
        optionText: opt.optionText || '',
        isCorrect: !!opt.isCorrect,
      })),
    }));
  };

  // Reset the form and exit edit mode
  const resetForm = () => {
    setFormData({
      subject: '',
      paperType: '',
      year: '',
      month: '',
      examStage: '',
      paperNo: '',
      questionNumber: '',
      questionText: '',
      answerText: '',
      pageNumber: '',
      subQuestions: [],
    });
    setErrors({});
    setEditingQuestionId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      alert('Please fix the validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    const sanitizedData = {
      subject: formData.subject,
      paperType: formData.paperType,
      year: formData.year,
      month: formData.month,
      examStage: formData.examStage,
      paperNo: formData.paperNo,
      questionNumber: formData.questionNumber,
      questionText: DOMPurify.sanitize(formData.questionText),
      answerText: DOMPurify.sanitize(formData.answerText || ''),
      pageNumber: formData.pageNumber,
      subQuestions: cleanSubQuestions(formData.subQuestions),
    };

    console.log('Form Data before submission:', formData);
    console.log('Sanitized Data:', sanitizedData);

    try {
      const response = await fetch('https://ca-project-new.onrender.com/api/questions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });
      const result = await response.json();
      console.log('Submission response:', response.status, result);
      if (response.ok) {
        setLastSubmittedId(result.id);
        applyFilters(token);
        alert('Question added successfully');
        // Reset the form after successful submission
        resetForm();
      } else {
        alert(`Failed to add question: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const validation = validateForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      alert('Please fix the validation errors before updating.');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const sanitizedData = {
      subject: formData.subject,
      paperType: formData.paperType,
      year: formData.year,
      month: formData.month,
      examStage: formData.examStage,
      paperNo: formData.paperNo,
      questionNumber: formData.questionNumber,
      questionText: DOMPurify.sanitize(formData.questionText),
      answerText: DOMPurify.sanitize(formData.answerText || ''),
      pageNumber: formData.pageNumber,
      subQuestions: cleanSubQuestions(formData.subQuestions),
    };

    try {
      const response = await fetch(`https://ca-project-new.onrender.com/api/questions/${editingQuestionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });
      const result = await response.json();
      console.log('Update response:', response.status, result);
      if (response.ok) {
        setLastSubmittedId(editingQuestionId);
        applyFilters(token);
        alert('Question updated successfully');
        // Reset the form after successful update to exit edit mode
        resetForm();
      } else {
        alert(`Failed to update question: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert(`Error updating question: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (question) => {
    setFormData({
      subject: question.subject || '',
      paperType: question.paperType || '',
      year: question.year || '',
      month: question.month || '',
      examStage: question.examStage || '',
      paperNo: question.paperNo || '',
      questionNumber: question.questionNumber || '',
      questionText: question.questionText || '',
      answerText: question.answerText || '',
      pageNumber: question.pageNumber || '',
      subQuestions: question.subQuestions ? [...question.subQuestions] : [],
    });
    setEditingQuestionId(question.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://ca-project-new.onrender.com/api/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok) {
        applyFilters(token);
        alert('Question deleted successfully');
      } else {
        alert(`Failed to delete question: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert(`Error deleting question: ${error.message}`);
    }
  };

  const visibleErrors = Object.values(errors).filter((error) => error);

  return (
    <div className="page-wrapper">
      <Navbar />
      <section className="admin-section">
        <div className="admin-container">
          <h1>Admin Panel</h1>
          {visibleErrors.length > 0 && (
            <div className="error">
              <h3 className="error-title">Validation Errors:</h3>
              <ul className="error-list">
                {visibleErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={editingQuestionId ? handleUpdate : handleSubmit} className="admin-form">
            <div className="form-section">
              <h2>General Details</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Exam Stage:</label>
                  <select
                    name="examStage"
                    value={formData.examStage}
                    onChange={(e) => {
                      // Reset subject and paperNo when exam stage changes
                      const newExamStage = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        examStage: newExamStage,
                        subject: '',
                        paperNo: ''
                      }));
                      validateField('examStage', newExamStage);
                    }}
                    className="form-input"
                    required
                  >
                    <option value="">Select Exam Stage</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Final">Final</option>
                  </select>
                  {errors.examStage && <p className="error-message">{errors.examStage}</p>}
                </div>
                <div className="form-group">
                  <label>Subject:</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Subject</option>
                    {formData.examStage === 'Foundation' ? (
                      // Foundation subjects
                      <>
                        <option value="Principles and Practices of Accounting">Principles and Practices of Accounting</option>
                        <option value="Business Law">Business Law</option>
                        <option value="Business Correspondence and Reporting">Business Correspondence and Reporting</option>
                        <option value="Business Mathematics">Business Mathematics</option>
                        <option value="Logical Reasoning">Logical Reasoning</option>
                        <option value="Statistics">Statistics</option>
                        <option value="Business Economics">Business Economics</option>
                        <option value="Business and Commercial Knowledge">Business and Commercial Knowledge</option>
                      </>
                    ) : formData.examStage === 'Intermediate' ? (
                      // Intermediate subjects
                      <>
                        <option value="Advanced Accounting">Advanced Accounting</option>
                        <option value="Corporate Laws">Corporate Laws</option>
                        <option value="Cost and Management Accounting">Cost and Management Accounting</option>
                        <option value="Taxation">Taxation</option>
                        <option value="Auditing and Code of Ethics">Auditing and Code of Ethics</option>
                        <option value="Financial and Strategic Management">Financial and Strategic Management</option>
                      </>
                    ) : formData.examStage === 'Final' ? (
                      // Final subjects
                      <>
                        <option value="Financial Reporting">Financial Reporting</option>
                        <option value="Advanced Financial Management">Advanced Financial Management</option>
                        <option value="Advanced Auditing">Advanced Auditing</option>
                        <option value="Direct and International Tax Laws">Direct and International Tax Laws</option>
                        <option value="Indirect Tax Laws">Indirect Tax Laws</option>
                        <option value="Integrated Business Solutions">Integrated Business Solutions</option>
                      </>
                    ) : (
                      // Default subjects when no exam stage is selected
                      <>
                        <option value="Advanced Accounting">Advanced Accounting</option>
                        <option value="Corporate Laws">Corporate Laws</option>
                        <option value="Taxation">Taxation</option>
                        <option value="Cost & Management">Cost & Management</option>
                        <option value="Auditing">Auditing</option>
                        <option value="Financial Management">Financial Management</option>
                      </>
                    )}
                  </select>
                  {errors.subject && <p className="error-message">{errors.subject}</p>}
                </div>
                <div className="form-group">
                  <label>Paper Type:</label>
                  <select
                    name="paperType"
                    value={formData.paperType}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Paper Type</option>
                    <option value="MTP">MTP</option>
                    <option value="RTP">RTP</option>
                    <option value="PYQS">PYQS</option>
                  </select>
                  {errors.paperType && <p className="error-message">{errors.paperType}</p>}
                </div>
                <div className="form-group">
                  <label>Year:</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                  </select>
                  {errors.year && <p className="error-message">{errors.year}</p>}
                </div>
                <div className="form-group">
                  <label>Month:</label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                  {errors.month && <p className="error-message">{errors.month}</p>}
                </div>
                {formData.examStage === 'Foundation' && (
                  <div className="form-group">
                    <label>Paper No.:</label>
                    <select
                      name="paperNo"
                      value={formData.paperNo}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select Paper</option>
                      <option value="Paper 1">Paper 1</option>
                      <option value="Paper 2">Paper 2</option>
                      <option value="Paper 3">Paper 3</option>
                      <option value="Paper 4">Paper 4</option>
                    </select>
                    {errors.paperNo && <p className="error-message">{errors.paperNo}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h2>Question Details</h2>
              <div className="form-group">
                <label>Question Number:</label>
                <input
                  type="text"
                  name="questionNumber"
                  value={formData.questionNumber}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                {errors.questionNumber && <p className="error-message">{errors.questionNumber}</p>}
              </div>
              <div className="form-group">
                <label>Question Text:</label>
                <textarea
                  name="questionText"
                  value={formData.questionText}
                  onChange={handleChange}
                  rows={6}
                  className="form-input"
                  placeholder="Paste HTML code for tables, or just type your question..."
                />
                {errors.questionText && <p className="error-message">{errors.questionText}</p>}
              </div>
            </div>

            <div className="form-section">
              <h2>Answer (for Subjective Questions)</h2>
              <div className="form-group">
                <label>Answer Text:</label>
                <textarea
                  name="answerText"
                  value={formData.answerText}
                  onChange={handleChange}
                  rows={6}
                  className="form-input"
                  placeholder="Paste HTML code for tables, or just type your answer..."
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Reference</h2>
              <div className="form-group">
                <label>Page Number:</label>
                <input
                  type="text"
                  name="pageNumber"
                  value={formData.pageNumber}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                {errors.pageNumber && <p className="error-message">{errors.pageNumber}</p>}
              </div>
            </div>

            <div className="form-section">
              <h2>Sub-Questions (Optional)</h2>
              {formData.subQuestions.map((subQ, subIndex) => (
                <div key={subIndex} className="sub-question-section">
                  <div className="form-group">
                    <label>Sub Question Number:</label>
                    <input
                      type="text"
                      name="subQuestionNumber"
                      value={subQ.subQuestionNumber}
                      onChange={(e) => handleSubQuestionChange(subIndex, 'subQuestionNumber', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Sub Question Text:</label>
                    <textarea
                      name="subQuestionText"
                      value={subQ.subQuestionText}
                      onChange={(e) => handleSubQuestionChange(subIndex, 'subQuestionText', e.target.value)}
                      className="form-input"
                    />
                    {errors[`subQuestion_${subIndex}`] && <p className="error-message">{errors[`subQuestion_${subIndex}`]}</p>}
                  </div>
                  <div className="sub-options-section">
                    {subQ.subOptions.map((subOpt, optIndex) => (
                      <div key={optIndex} className="form-group">
                        <label>Option {optIndex + 1}:</label>
                        <input
                          type="text"
                          name="optionText"
                          value={subOpt.optionText}
                          onChange={(e) => handleSubOptionChange(subIndex, optIndex, e)}
                          className="form-input"
                        />
                        <button
                          type="button"
                          onClick={() => markCorrectSubOption(subIndex, optIndex)}
                          className="mark-correct-btn"
                        >
                          Mark as Correct
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSubOption(subIndex, optIndex)}
                          className="remove-btn"
                        >
                          Remove Option
                        </button>
                        {errors[`subOption_${subIndex}_${optIndex}`] && <p className="error-message">{errors[`subOption_${subIndex}_${optIndex}`]}</p>}
                      </div>
                    ))}
                    <button type="button" onClick={() => addSubOption(subIndex)} className="add-btn">
                      Add Sub Option
                    </button>
                  </div>
                  <button type="button" onClick={() => removeSubQuestion(subIndex)} className="remove-btn">
                    Remove This Sub Question
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSubQuestion} className="add-btn">
                Add Sub Question
              </button>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handlePreview}
                className="preview-btn"
                disabled={isSubmitting}
              >
                Preview
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : editingQuestionId ? 'Update' : 'Submit'}
              </button>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setEditingQuestionId(null);
                  }}
                  className="cancel-btn"
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          {/* Advanced Filtering Section */}
          <div className="filter-section">
            <h2>Filter Questions</h2>
            <div className="filter-grid">
              <div className="form-group">
                <label>Exam Stage:</label>
                <select
                  name="examStage"
                  value={filters.examStage}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All</option>
                  <option value="Foundation">Foundation</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  name="subject"
                  value={filters.subject}
                  onChange={handleFilterChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Year:</label>
                <input
                  type="text"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Question Number:</label>
                <input
                  type="text"
                  name="questionNumber"
                  value={filters.questionNumber}
                  onChange={handleFilterChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Paper Type:</label>
                <select
                  name="paperType"
                  value={filters.paperType}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All</option>
                  <option value="MTP">MTP</option>
                  <option value="RTP">RTP</option>
                  <option value="PYQS">PYQS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Month:</label>
                <select
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>
              {filters.examStage === 'Foundation' && (
                <div className="form-group">
                  <label>Paper No.:</label>
                  <select
                    name="paperNo"
                    value={filters.paperNo}
                    onChange={handleFilterChange}
                    className="form-input"
                  >
                    <option value="">All</option>
                    <option value="Paper 1">Paper 1</option>
                    <option value="Paper 2">Paper 2</option>
                    <option value="Paper 3">Paper 3</option>
                    <option value="Paper 4">Paper 4</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Search Keyword:</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="form-input"
                  placeholder="Enter keywords"
                />
              </div>
            </div>
            <button onClick={() => applyFilters(localStorage.getItem('token'))} className="apply-filter-btn">
              Apply Filters
            </button>
          </div>

          <div className="stored-questions-section">
            <h2>Stored Questions</h2>
            {storedQuestions.length === 0 ? (
              <p className="no-questions">No questions stored yet.</p>
            ) : (
              <div className="questions-list">
                {storedQuestions.map((question) => (
                  <div key={question.id} className="question-card">
                    <p><strong>Subject:</strong> {question.subject || 'N/A'}</p>
                    <p><strong>Paper Type:</strong> {question.paperType || 'N/A'}</p>
                    <p><strong>Year:</strong> {question.year || 'N/A'}</p>
                    <p><strong>Month:</strong> {question.month || 'N/A'}</p>
                    <p><strong>Exam Stage:</strong> {question.examStage || 'N/A'}</p>
                    {question.paperNo && <p><strong>Paper No.:</strong> {question.paperNo || 'N/A'}</p>}
                    <p><strong>Question Number:</strong> {question.questionNumber || 'N/A'}</p>
                    <h3>Question Text:</h3>
                    <div
                      className="question-text"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.questionText || 'N/A') }}
                    />
                    {question.answerText && (
                      <>
                        <h3>Answer Text:</h3>
                        <div
                          className="question-text"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.answerText || 'N/A') }}
                        />
                      </>
                    )}
                    {question.subQuestions && question.subQuestions.length > 0 && (
                      <div>
                        <h3>Sub-Questions:</h3>
                        {question.subQuestions.map((subQ, subIdx) => (
                          <div key={subIdx} className="sub-question">
                            <p><strong>Sub Question Number:</strong> {subQ.subQuestionNumber || 'N/A'}</p>
                            <p><strong>Sub Question Text:</strong> {subQ.subQuestionText || 'N/A'}</p>
                            {subQ.subOptions && subQ.subOptions.length > 0 && (
                              <ul className="sub-options">
                                {subQ.subOptions.map((subOpt, optIdx) => (
                                  <li key={optIdx}>
                                    {subOpt.optionText || 'N/A'}{' '}
                                    {subOpt.isCorrect && <span className="correct-answer">(Correct)</span>}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p><strong>Page Number:</strong> {question.pageNumber || 'N/A'}</p>
                    <div className="question-actions">
                      <button
                        onClick={() => handleEdit(question)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {previewVisible && <PreviewPanel data={formData} onClose={closePreview} />}
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
