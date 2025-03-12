import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PreviewPanel from './PreviewPanel';
import DOMPurify from 'dompurify';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    examType: '',
    year: '',
    month: '',
    group: '',
    paperName: '',
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
  const [filters, setFilters] = useState({
    subject: '',
    year: '',
    questionNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    } else {
      applyFilters(token);
    }
  }, [navigate]);

  const fetchQuestions = async (token, query = '') => {
    try {
      const response = await fetch(`http://localhost:5000/api/questions${query ? `?${query}` : ''}`, {
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
        // Sort questions by id in descending order to show the latest at the top
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
    setFormData((prev) => ({
      ...prev,
      subQuestions: prev.subQuestions.filter((_, i) => i !== index),
    }));
  };

  const handleSubQuestionChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.subQuestions];
    updated[index][name] = value;
    setFormData((prev) => ({ ...prev, subQuestions: updated }));
    validateSubQuestion(index, name, value);
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
      case 'examType':
        if (!value || value === '') error = 'Exam Type is required';
        break;
      case 'year':
        if (!value || value === '') error = 'Year is required';
        break;
      case 'month':
        if (!value || value === '') error = 'Month is required';
        break;
      case 'group':
        if (!value || value === '' || value === 'Select Group') error = 'Group is required';
        break;
      case 'paperName':
        if (!value || value === '' || value === 'Select Paper') error = 'Paper Name is required';
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

  const validateSubQuestion = (index, name, value) => {
    let error = name === 'subQuestionText' && !value.trim() ? `Sub-question ${index + 1} text is required` : '';
    setErrors((prev) => ({ ...prev, [`subQuestion_${index}`]: error }));
  };

  const validateSubOption = (subIndex, optionIndex, name, value) => {
    let error = name === 'optionText' && !value.trim() ? `Sub-question ${subIndex + 1}, Option ${optionIndex + 1} text is required` : '';
    setErrors((prev) => ({ ...prev, [`subOption_${subIndex}_${optionIndex}`]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    ['subject', 'examType', 'year', 'month', 'group', 'paperName', 'questionNumber', 'questionText', 'pageNumber'].forEach((field) => {
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

  const resetForm = () => {
    setFormData({
      subject: '',
      examType: '',
      year: '',
      month: '',
      group: '',
      paperName: '',
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
      examType: formData.examType,
      year: formData.year,
      month: formData.month,
      group: formData.group,
      paperName: formData.paperName,
      questionNumber: formData.questionNumber,
      questionText: DOMPurify.sanitize(formData.questionText),
      answerText: DOMPurify.sanitize(formData.answerText || ''),
      pageNumber: formData.pageNumber,
      subQuestions: cleanSubQuestions(formData.subQuestions),
    };

    console.log('Form Data before submission:', formData);
    console.log('Sanitized Data:', sanitizedData);

    try {
      const response = await fetch('http://localhost:5000/api/questions', {
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
      examType: formData.examType,
      year: formData.year,
      month: formData.month,
      group: formData.group,
      paperName: formData.paperName,
      questionNumber: formData.questionNumber,
      questionText: DOMPurify.sanitize(formData.questionText),
      answerText: DOMPurify.sanitize(formData.answerText || ''),
      pageNumber: formData.pageNumber,
      subQuestions: cleanSubQuestions(formData.subQuestions),
    };

    try {
      const response = await fetch(`http://localhost:5000/api/questions/${editingQuestionId}`, {
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
      examType: question.examType || '',
      year: question.year || '',
      month: question.month || '',
      group: question.group || '',
      paperName: question.paperName || '',
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
      const response = await fetch(`http://localhost:5000/api/questions/${id}`, {
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      {visibleErrors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Validation Errors:</h3>
          <ul className="list-disc pl-5">
            {visibleErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={editingQuestionId ? handleUpdate : handleSubmit} className="space-y-6">
        <fieldset className="border p-4 rounded">
          <legend className="text-lg font-semibold">General Details</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">
                Subject:
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Subject</option>
                  <option value="Advanced Accounting">Advanced Accounting</option>
                  <option value="Corporate Laws">Corporate Laws</option>
                  <option value="Taxation">Taxation</option>
                  <option value="Cost & Management">Cost & Management</option>
                  <option value="Auditing">Auditing</option>
                  <option value="Financial Management">Financial Management</option>
                </select>
                {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
              </label>
            </div>
            <div>
              <label className="block mb-1">
                Exam Type:
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Exam Type</option>
                  <option value="MTP">MTP</option>
                  <option value="RTP">RTP</option>
                </select>
                {errors.examType && <p className="text-red-500 text-sm">{errors.examType}</p>}
              </label>
            </div>
            <div>
              <label className="block mb-1">
                Year:
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
                {errors.year && <p className="text-red-500 text-sm">{errors.year}</p>}
              </label>
            </div>
            <div>
              <label className="block mb-1">
                Month:
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Month</option>
                  <option value="March">March</option>
                  <option value="February">February</option>
                </select>
                {errors.month && <p className="text-red-500 text-sm">{errors.month}</p>}
              </label>
            </div>
            <div>
              <label className="block mb-1">
                Group:
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Group</option>
                  <option value="Group I">Group I</option>
                  <option value="Group II">Group II</option>
                </select>
                {errors.group && <p className="text-red-500 text-sm">{errors.group}</p>}
              </label>
            </div>
            <div>
              <label className="block mb-1">
                Paper Name:
                <select
                  name="paperName"
                  value={formData.paperName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Paper</option>
                  <option value="Paper 01">Paper 01</option>
                  <option value="Paper 02">Paper 02</option>
                  <option value="Paper 03">Paper 03</option>
                  <option value="Paper 04">Paper 04</option>
                  <option value="Paper 05">Paper 05</option>
                  <option value="Paper 06">Paper 06</option>
                </select>
                {errors.paperName && <p className="text-red-500 text-sm">{errors.paperName}</p>}
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset className="border p-4 rounded">
          <legend className="text-lg font-semibold">Question Details</legend>
          <div className="space-y-4">
            <label className="block">
              Question Number:
              <input
                type="text"
                name="questionNumber"
                value={formData.questionNumber}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
              {errors.questionNumber && <p className="text-red-500 text-sm">{errors.questionNumber}</p>}
            </label>
            <label className="block">
              Question Text:
              <textarea
                name="questionText"
                value={formData.questionText}
                onChange={handleChange}
                rows={6}
                className="w-full p-2 border rounded"
                placeholder="Paste HTML code for tables, or just type your question..."
              />
              {errors.questionText && <p className="text-red-500 text-sm">{errors.questionText}</p>}
            </label>
          </div>
        </fieldset>

        <fieldset className="border p-4 rounded">
          <legend className="text-lg font-semibold">Answer (for Subjective Questions)</legend>
          <label className="block">
            Answer Text:
            <textarea
              name="answerText"
              value={formData.answerText}
              onChange={handleChange}
              rows={6}
              className="w-full p-2 border rounded"
              placeholder="Paste HTML code for tables, or just type your answer..."
            />
          </label>
        </fieldset>

        <fieldset className="border p-4 rounded">
          <legend className="text-lg font-semibold">Reference</legend>
          <div className="space-y-4">
            <label className="block">
              Page Number:
              <input
                type="text"
                name="pageNumber"
                value={formData.pageNumber}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
              {errors.pageNumber && <p className="text-red-500 text-sm">{errors.pageNumber}</p>}
            </label>
          </div>
        </fieldset>

        <fieldset className="border p-4 rounded">
          <legend className="text-lg font-semibold">Sub-Questions (Optional)</legend>
          {formData.subQuestions.map((subQ, subIndex) => (
            <div key={subIndex} className="border p-4 rounded mb-4">
              <label className="block mb-2">
                Sub Question Number:
                <input
                  type="text"
                  name="subQuestionNumber"
                  value={subQ.subQuestionNumber}
                  onChange={(e) => handleSubQuestionChange(subIndex, e)}
                  className="w-full p-2 border rounded"
                />
              </label>
              <label className="block mb-2">
                Sub Question Text:
                <textarea
                  name="subQuestionText"
                  value={subQ.subQuestionText}
                  onChange={(e) => handleSubQuestionChange(subIndex, e)}
                  className="w-full p-2 border rounded"
                />
                {errors[`subQuestion_${subIndex}`] && (
                  <p className="text-red-500 text-sm">{errors[`subQuestion_${subIndex}`]}</p>
                )}
              </label>
              <fieldset className="border p-4 rounded mt-2">
                <legend className="text-md font-semibold">Sub-Question Options</legend>
                {subQ.subOptions.map((subOpt, optIndex) => (
                  <div key={optIndex} className="mb-2">
                    <label className="block">
                      Option {optIndex + 1}:
                      <input
                        type="text"
                        name="optionText"
                        value={subOpt.optionText}
                        onChange={(e) => handleSubOptionChange(subIndex, optIndex, e)}
                        className="w-full p-2 border rounded"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => markCorrectSubOption(subIndex, optIndex)}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Mark as Correct
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSubOption(subIndex, optIndex)}
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove Option
                    </button>
                    {errors[`subOption_${subIndex}_${optIndex}`] && (
                      <p className="text-red-500 text-sm">{errors[`subOption_${subIndex}_${optIndex}`]}</p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSubOption(subIndex)}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Sub Option
                </button>
              </fieldset>
              <button
                type="button"
                onClick={() => removeSubQuestion(subIndex)}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove This Sub Question
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSubQuestion}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Sub Question
          </button>
        </fieldset>

        <div className="space-x-4">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isSubmitting}
          >
            Preview
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Filter Questions</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <label>
            Subject:
            <input
              type="text"
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </label>
          <label>
            Year:
            <input
              type="text"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </label>
          <label>
            Question Number:
            <input
              type="text"
              name="questionNumber"
              value={filters.questionNumber}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </label>
        </div>
        <button
          onClick={() => applyFilters(localStorage.getItem('token'))}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Apply Filters
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Stored Questions</h2>
        {storedQuestions.length === 0 ? (
          <p className="text-gray-500">No questions stored yet.</p>
        ) : (
          <div className="space-y-6">
            {storedQuestions.map((question) => (
              <div key={question.id} className="border border-gray-200 p-4 rounded-lg shadow-md">
                <p><strong>Subject:</strong> {question.subject || 'N/A'}</p>
                <p><strong>Exam Type:</strong> {question.examType || 'N/A'}</p>
                <p><strong>Year:</strong> {question.year || 'N/A'}</p>
                <p><strong>Month:</strong> {question.month || 'N/A'}</p>
                <p><strong>Group:</strong> {question.group || 'N/A'}</p>
                <p><strong>Paper Name:</strong> {question.paperName || 'N/A'}</p>
                <p><strong>Question Number:</strong> {question.questionNumber || 'N/A'}</p>
                <h3 className="text-lg font-semibold mt-2">Question Text:</h3>
                <div
                  className="prose prose-blue max-w-none text-black"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.questionText || 'N/A') }}
                />
                {question.answerText && (
                  <>
                    <h3 className="text-lg font-semibold mt-2">Answer Text:</h3>
                    <div
                      className="prose prose-blue max-w-none text-black"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.answerText || 'N/A') }}
                    />
                  </>
                )}
                {question.subQuestions && question.subQuestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mt-2">Sub-Questions:</h3>
                    {question.subQuestions.map((subQ, subIdx) => (
                      <div key={subIdx} className="mt-2">
                        <p><strong>Sub Question Number:</strong> {subQ.subQuestionNumber || 'N/A'}</p>
                        <p><strong>Sub Question Text:</strong> {subQ.subQuestionText || 'N/A'}</p>
                        {subQ.subOptions && subQ.subOptions.length > 0 && (
                          <ul className="list-disc pl-5 mt-1">
                            {subQ.subOptions.map((subOpt, optIdx) => (
                              <li key={optIdx}>
                                {subOpt.optionText || 'N/A'}{' '}
                                {subOpt.isCorrect && <span className="text-green-500 font-bold">(Correct)</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p><strong>Page Number:</strong> {question.pageNumber || 'N/A'}</p>
                <div className="mt-4 space-x-4">
                  <button
                    onClick={() => handleEdit(question)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
  );
};

export default AdminPanel;