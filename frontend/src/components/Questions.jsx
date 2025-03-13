import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import './Questions.css';

const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ subject: '', examType: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnswers, setShowAnswers] = useState(false);
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

  const filteredQuestions = questions.filter((q) => {
    return (
      (!filters.subject || q.subject === filters.subject) &&
      (!filters.examType || q.examType === filters.examType)
    );
  });

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">CA Exam Questions</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      <div className="mb-6 flex space-x-4">
        <label className="flex items-center">
          Filter by Subject:
          <select
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="ml-2 p-2 border rounded"
          >
            <option value="">All</option>
            <option value="Advanced Accounting">Advanced Accounting</option>
            <option value="Corporate Laws">Corporate Laws</option>
            <option value="Taxation">Taxation</option>
            <option value="Cost & Management">Cost & Management</option>
            <option value="Auditing">Auditing</option>
            <option value="Financial Management">Financial Management</option>
          </select>
        </label>
        <label className="flex items-center">
          Filter by Exam Type:
          <select
            value={filters.examType}
            onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
            className="ml-2 p-2 border rounded"
          >
            <option value="">All</option>
            <option value="MTP">MTP</option>
            <option value="RTP">RTP</option>
          </select>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={(e) => setShowAnswers(e.target.checked)}
            className="mr-2"
          />
          Show Answers
        </label>
      </div>
      {filteredQuestions.length === 0 && !error && <p>No questions available.</p>}
      {currentQuestions.length > 0 && (
        <>
          {currentQuestions.map((question) => (
            <div
              key={question.id}
              className="mb-6 p-4 border rounded-lg shadow"
            >
              <h2 className="text-xl font-semibold">
                {question.subject} - {question.examType} ({question.year})
                {question.month && `, ${question.month}`}
                {question.group && `, ${question.group}`}
                {question.paperName && `, ${question.paperName}`}
              </h2>
              {question.questionNumber && (
                <p className="mt-2"><strong>Question Number:</strong> {question.questionNumber}</p>
              )}
              <p className="mt-2"><strong>Question:</strong></p>
              <div className="mt-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.questionText) }} />
              {showAnswers && question.answerText && (
                <>
                  <p className="mt-2"><strong>Answer:</strong></p>
                  <div className="mt-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.answerText) }} />
                </>
              )}
              {question.pdfFile && (
                <p className="mt-2"><strong>PDF:</strong> <a href={question.pdfFile} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{question.pdfFile}</a></p>
              )}
              {question.pageNumber && (
                <p className="mt-2"><strong>Page:</strong> {question.pageNumber}</p>
              )}
              {question.subQuestions && question.subQuestions.length > 0 && (
                <>
                  <h3 className="mt-4 text-lg font-semibold">Sub-Questions</h3>
                  {question.subQuestions.map((subQ, index) => (
                    <div key={index} className="mt-2">
                      <p><strong>Sub-Question {subQ.subQuestionNumber}:</strong> {subQ.subQuestionText}</p>
                      <ul className="list-disc pl-5 mt-2">
                        {subQ.subOptions.map((opt, optIndex) => (
                          <li key={optIndex} className="ml-4">
                            {opt.optionText} {opt.isCorrect && <span className="text-green-500">(Correct)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
          <div className="flex justify-center space-x-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 border rounded ${currentPage === number ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}
              >
                {number}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Questions;