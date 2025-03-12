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
  const [lastSubmittedId, setLastSubmittedId] = useState(null); // Track the last submitted question ID

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
      if (response.ok) {
        const questions = await response.json();
        console.log('Fetched questions with all fields:', questions);
        setStoredQuestions(questions);
        // Reset form only after fetching the new question
        if (lastSubmittedId && questions.some(q => q.id === lastSubmittedId)) {
          resetForm();
          setLastSubmittedId(null); // Clear the last submitted ID
        }
      } else {
        console.error('Failed to fetch questions:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const applyFilters = (token) => {
    const query = new URLSearchParams(filters).toString();
    fetchQuestions(token, query);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`handleChange - ${name}: ${value}`);
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      console.log(`Updated formData for ${name}:`, updated);
      return updated;
    });
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
    setFormData((prev) => {
      const updated = [...prev.subQuestions];
      updated[index][name] = value;
      return { ...prev, subQuestions: updated };
    });
    validateSubQuestion(index, name, value);
  };

  const addSubOption = (subIndex) => {
    setFormData((prev) => {
      const updated = [...prev.subQuestions];
      updated[subIndex].subOptions.push({ optionText: '', isCorrect: false });
      return { ...prev, subQuestions: updated };
    });
  };

  const removeSubOption = (subIndex, optionIndex) => {
    setFormData((prev) => {
      const updated = [...prev.subQuestions];
      if (updated[subIndex].subOptions.length > 1) {
        updated[subIndex].subOptions = updated[subIndex].subOptions.filter((_, i) => i !== optionIndex);
      }
      return { ...prev, subQuestions: updated };
    });
  };

  const handleSubOptionChange = (subIndex, optionIndex, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.subQuestions];
      updated[subIndex].subOptions[optionIndex][name] = value;
      return { ...prev, subQuestions: updated };
    });
    validateSubOption(subIndex, optionIndex, name, value);
  };

  const markCorrectSubOption = (subIndex, optionIndex) => {
    setFormData((prev) => {
      const updated = [...prev.subQuestions];
      updated[subIndex].subOptions = updated[subIndex].subOptions.map((opt, i) => ({
        ...opt,
        isCorrect: i === optionIndex,
      }));
      return { ...prev, subQuestions: updated };
    });
  };

  const handlePreview = () => {
    const validation = validateForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      alert('Please fix the validation errors before previewing.');
    } else {
      setPreviewVisible(true);
      console.log('Preview data:', formData);
    }
  };

  const closePreview = () => {
    setPreviewVisible(false);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'subject':
        if (!value || value === '') {
          error = 'Subject is required';
        }
        break;
      case 'examType':
        if (!value || value === '') {
          error = 'Exam Type is required';
        }
        break;
      case 'year':
        if (!value || value === '') {
          error = 'Year is required';
        }
        break;
      case 'month':
        if (!value || value === '') {
          error = 'Month is required';
        }
        break;
      case 'group':
        if (!value || value === '' || value === 'Select Group') {
          error = 'Group is required';
        }
        break;
      case 'paperName':
        if (!value || value === '' || value === 'Select Paper') {
          error = 'Paper Name is required';
        }
        break;
      case 'questionNumber':
        if (!value) {
          error = 'Question Number is required';
        }
        break;
      case 'pageNumber':
        if (!value) {
          error = 'Page Number is required';
        }
        break;
      case 'questionText':
        if (!value) {
          error = 'Question text is required';
        }
        break;
      default:
        break;
    }
    setErrors((prev) => {
      const updatedErrors = { ...prev, [name]: error };
      if (!error) delete updatedErrors[name];
      return updatedErrors;
    });
  };

  const validateSubQuestion = (index, name, value) => {
    let error = '';
    if (name === 'subQuestionText' && !value.trim()) {
      error = `Sub-question ${index + 1} text is required`;
    }
    setErrors((prev) => {
      const updatedErrors = { ...prev, [`subQuestion_${index}`]: error };
      if (!error) delete updatedErrors[`subQuestion_${index}`];
      return updatedErrors;
    });
  };

  const validateSubOption = (subIndex, optionIndex, name, value) => {
    let error = '';
    if (name === 'optionText' && !value.trim()) {
      error = `Sub-question ${subIndex + 1}, Option ${optionIndex + 1} text is required`;
    }
    setErrors((prev) => {
      const updatedErrors = { ...prev, [`subOption_${subIndex}_${optionIndex}`]: error };
      if (!error) delete updatedErrors[`subOption_${subIndex}_${optionIndex}`];
      return updatedErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'answerText' && key !== 'subQuestions') {
        validateField(key, formData[key]);
        if (errors[key]) {
          newErrors[key] = errors[key];
        }
      }
    });
    formData.subQuestions.forEach((subQ, index) => {
      validateSubQuestion(index, 'subQuestionText', subQ.subQuestionText);
      if (errors[`subQuestion_${index}`]) {
        newErrors[`subQuestion_${index}`] = errors[`subQuestion_${index}`];
      }
      subQ.subOptions.forEach((opt, optIndex) => {
        validateSubOption(index, optIndex, 'optionText', opt.optionText);
        if (errors[`subOption_${index}_${optIndex}`]) {
          newErrors[`subOption_${index}_${optIndex}`] = errors[`subOption_${index}_${optIndex}`];
        }
      });
    });
    console.log('Validation errors:', newErrors);
    return newErrors;
  };

  const cleanSubQuestions = (subQuestions) => {
    return subQuestions.map(subQ => ({
      subQuestionNumber: subQ.subQuestionNumber || '',
      subQuestionText: subQ.subQuestionText || '', // Preserve even if empty
      subOptions: subQ.subOptions.map(opt => ({
        optionText: opt.optionText || '', // Preserve even if empty
        isCorrect: !!opt.isCorrect,
      })),
    }));
  };

  const resetForm = () => {
    console.log('Resetting form');
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

    // Normalize and set default values for all required fields
    const normalizedSubject = formData.subject
      ? formData.subject
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      : 'Advanced Accounting';
    const normalizedExamType = formData.examType || 'MTP';
    const normalizedYear = formData.year || '2024';
    const normalizedMonth = formData.month || 'March';
    const normalizedGroup = formData.group || 'Group I';
    const normalizedPaperName = formData.paperName || 'Paper 01';

    const sanitizedData = {
      subject: normalizedSubject,
      examType: normalizedExamType,
      year: normalizedYear,
      month: normalizedMonth,
      group: normalizedGroup,
      paperName: normalizedPaperName,
      questionNumber: formData.questionNumber || '1',
      questionText: DOMPurify.sanitize(formData.questionText || 'Default question text'),
      answerText: DOMPurify.sanitize(formData.answerText || ''), // Ensure answerText is sent
      pageNumber: formData.pageNumber || '1', // Use formData value directly
      subQuestions: cleanSubQuestions(formData.subQuestions), // Updated to preserve empty values
    };

    console.log('Form Data before sanitization:', formData);
    console.log('Normalized Data:', sanitizedData);

    const formDataToSend = new FormData();
    Object.keys(sanitizedData).forEach((key) => {
      if (key === 'subQuestions') {
        formDataToSend.append(key, JSON.stringify(sanitizedData[key]));
      } else {
        formDataToSend.append(key, sanitizedData[key]);
      }
    });

    // Debug FormData
    for (let [key, value] of formDataToSend.entries()) {
      console.log(`FormData Entry - ${key}: ${value}`);
    }
    console.log('Final FormData before fetch:', Object.fromEntries(formDataToSend.entries()));

    try {
      const response = await fetch('http://localhost:5000/api/questions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      const result = await response.json();
      if (response.ok) {
        const newQuestionId = result.id; // Assuming the response includes the new question ID
        setLastSubmittedId(newQuestionId); // Set the last submitted ID
        applyFilters(token); // Fetch updated questions
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
      ...formData,
      questionText: DOMPurify.sanitize(formData.questionText),
      answerText: DOMPurify.sanitize(formData.answerText || ''), // Ensure answerText is sent
      subQuestions: cleanSubQuestions(formData.subQuestions), // Updated to preserve empty values
    };

    const formDataToSend = new FormData();
    Object.keys(sanitizedData).forEach((key) => {
      if (key === 'subQuestions') {
        formDataToSend.append(key, JSON.stringify(sanitizedData[key]));
      } else {
        formDataToSend.append(key, sanitizedData[key] || '');
      }
    });

    try {
      const response = await fetch(`http://localhost:5000/api/questions/${editingQuestionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      const result = await response.json();
      if (response.ok) {
        setLastSubmittedId(editingQuestionId); // Set the last updated ID
        applyFilters(token); // Fetch updated questions
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
    console.log('Editing question:', question);
    setFormData({
      subject: question.subject || '',
      examType: question.examType || '',
      year: question.year || '',
      month: question.month || '',
      group: question.group || '',
      paperName: question.paperName || '',
      questionNumber: question.questionNumber || '',
      questionText: question.questionText || '',
      answerText: question.answerText || '', // Ensure answerText is set
      pageNumber: question.pageNumber || '', // Use fetched value
      subQuestions: question.subQuestions ? [...question.subQuestions] : [],
    });
    setEditingQuestionId(question.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

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
        alert('Question deleted successfully');
        applyFilters(token);
      } else {
        alert(`Failed to delete question: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert(`Error deleting question: ${error.message}`);
    }
  };

  const validateFormWithDefaults = (data) => {
    const newErrors = {};
    const requiredFields = ['subject', 'examType', 'year', 'month', 'group', 'paperName', 'questionNumber', 'questionText', 'pageNumber'];
    requiredFields.forEach((field) => {
      if (!data[field] || data[field] === '') {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });
    data.subQuestions.forEach((subQ, index) => {
      if (!subQ.subQuestionText.trim()) {
        newErrors[`subQuestion_${index}`] = `Sub-question ${index + 1} text is required`;
      }
      subQ.subOptions.forEach((opt, optIndex) => {
        if (!opt.optionText.trim()) {
          newErrors[`subOption_${index}_${optIndex}`] = `Sub-question ${index + 1}, Option ${optIndex + 1} text is required`;
        }
      });
    });
    return newErrors;
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
                {errors[`subQuestion_${subIndex}`] && <p className="text-red-500 text-sm">{errors[`subQuestion_${subIndex}`]}</p>}
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
                        onChange={(evt) => handleSubOptionChange(subIndex, optIndex, evt)}
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
                    {errors[`subOption_${subIndex}_${optIndex}`] && <p className="text-red-500 text-sm">{errors[`subOption_${subIndex}_${optIndex}`]}</p>}
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
            {isSubmitting ? 'Submitting...' : (editingQuestionId ? 'Update' : 'Submit')}
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
              <div
                key={question.id}
                className="border border-gray-200 p-4 rounded-lg shadow-md"
              >
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