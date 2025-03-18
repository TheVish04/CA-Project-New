import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Navbar from './Navbar';
import PreviewPanel from './PreviewPanel'; // We'll keep this import for now
import './Questions.css';

const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  // Updated filters state with additional criteria
  const [filters, setFilters] = useState({
    subject: '',
    examType: '',
    questionNumber: '',
    month: '',
    group: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnswers, setShowAnswers] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false); // State for modal visibility
  const [selectedQuestion, setSelectedQuestion] = useState(null); // State for selected question
  const questionsPerPage = 5;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    } else {
      const fetchQuestions = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/questions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch questions: Status ${response.status} - ${response.statusText}`);
          }
          const data = await response.json();
          console.log('Fetched questions:', data);
          setQuestions(data);
        } catch (error) {
          console.error('Error fetching questions:', error);
          setError(error.message);
        }
      };
      fetchQuestions();
    }
  }, [navigate]);

  const handlePreview = (questionId) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setPreviewOpen(true);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedQuestion(null);
  };

  // Generate unique question numbers for the current subject
  const getUniqueQuestionNumbers = () => {
    const subjectFiltered = questions.filter((q) => !filters.subject || q.subject === filters.subject);
    const uniqueQuestionNumbers = [...new Set(subjectFiltered.map((q) => q.questionNumber))];
    return uniqueQuestionNumbers.sort(); // Sort for better UX
  };

  // Updated filtering logic to include new criteria and search keyword (case-insensitive)
  const filteredQuestions = questions.filter((q) => {
    return (
      (!filters.subject || q.subject === filters.subject) &&
      (!filters.examType || q.examType === filters.examType) &&
      (!filters.questionNumber || q.questionNumber === filters.questionNumber) &&
      (!filters.month || q.month === filters.month) &&
      (!filters.group || q.group === filters.group) &&
      (!filters.search || (q.questionText && q.questionText.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // We'll modify the rendering of question cards to remove the preview button
  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="questions-section">
        <div className="questions-container">
          <h1>Question Papers</h1>
          
          {error && (
            <div className="error">
              <p>Error: {error}</p>
            </div>
          )}

          {/* Filters Section */}
          <div className="filters">
            <div className="filter-group">
              <label>Filter by Subject:</label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value, questionNumber: '' })}
              >
                <option value="">All</option>
                <option value="Advanced Accounting">Advanced Accounting</option>
                <option value="Corporate Laws">Corporate Laws</option>
                <option value="Taxation">Taxation</option>
                <option value="Cost & Management">Cost & Management</option>
                <option value="Auditing">Auditing</option>
                <option value="Financial Management">Financial Management</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Filter by Exam Type:</label>
              <select
                value={filters.examType}
                onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
              >
                <option value="">All</option>
                <option value="MTP">MTP</option>
                <option value="RTP">RTP</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Filter by Month:</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              >
                <option value="">All</option>
                <option value="March">March</option>
                <option value="February">February</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Filter by Group:</label>
              <select
                value={filters.group}
                onChange={(e) => setFilters({ ...filters, group: e.target.value })}
              >
                <option value="">All</option>
                <option value="Group I">Group I</option>
                <option value="Group II">Group II</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Filter by Question No.:</label>
              <select
                value={filters.questionNumber}
                onChange={(e) => setFilters({ ...filters, questionNumber: e.target.value })}
              >
                <option value="">All</option>
                {getUniqueQuestionNumbers().map((qn) => (
                  <option key={qn} value={qn}>
                    {qn}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Search Keyword:</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Enter keywords"
              />
            </div>
            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={(e) => setShowAnswers(e.target.checked)}
                />
                Show Answers
              </label>
            </div>
          </div>

          {filteredQuestions.length === 0 && !error && <p className="no-questions">No questions available.</p>}
          {currentQuestions.length > 0 && (
            <>
              <div className="questions-list">
                {currentQuestions.map((question) => (
                  <div key={question.id} className="question-card">
                    <h2>
                      {question.subject} - {question.examType} ({question.year})
                      {question.month && `, ${question.month}`}
                      {question.group && `, ${question.group}`}
                      {question.paperName && `, ${question.paperName}`}
                    </h2>
                    {question.questionNumber && (
                      <p><strong>Question Number:</strong> {question.questionNumber}</p>
                    )}
                    <p><strong>Question:</strong></p>
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.questionText) }} />
                    {showAnswers && question.answerText && (
                      <>
                        <p><strong>Answer:</strong></p>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.answerText) }} />
                      </>
                    )}
                    {question.pdfFile && (
                      <p>
                        <strong>PDF:</strong>{' '}
                        <a href={question.pdfFile} target="_blank" rel="noopener noreferrer">
                          {question.pdfFile}
                        </a>
                      </p>
                    )}
                    {question.pageNumber && (
                      <p><strong>Page:</strong> {question.pageNumber}</p>
                    )}
                    {question.subQuestions && question.subQuestions.length > 0 && (
                      <>
                        <h3>Sub-Questions</h3>
                        {question.subQuestions.map((subQ, index) => (
                          <div key={index} className="sub-question">
                            <p><strong>Sub-Question {subQ.subQuestionNumber}:</strong> {subQ.subQuestionText}</p>
                            <ul>
                              {subQ.subOptions.map((opt, optIndex) => (
                                <li key={optIndex}>
                                  {opt.optionText}{' '}
                                  {opt.isCorrect && <span className="correct-answer">(Correct)</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </>
                    )}
                    {/* Remove the preview button completely */}
                  </div>
                ))}
              </div>
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={currentPage === number ? 'active' : ''}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Keep the PreviewPanel component for now, but it won't be used */}
      {previewOpen && selectedQuestion && (
        <PreviewPanel data={selectedQuestion} onClose={handleClosePreview} />
      )}
    </div>
  );
};

export default Questions;