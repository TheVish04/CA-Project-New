import React from 'react';
import DOMPurify from 'dompurify';
import './PreviewPanel.css'; // Import CSS for styling

const PreviewPanel = ({ data, onClose }) => {
  // Log the data to debug
  console.log('Preview Data:', data);

  if (!data) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="preview-backdrop"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="preview-modal">
        <h2 className="preview-title">Preview</h2>
        <div className="preview-content">
          <p><strong>Subject:</strong> {data.subject || 'N/A'}</p>
          <p><strong>Exam Stage:</strong> {data.examStage || 'N/A'}</p>
          <p><strong>Paper Type:</strong> {data.paperType || 'N/A'}</p>
          <p><strong>Year:</strong> {data.year || 'N/A'}</p>
          <p><strong>Month:</strong> {data.month || 'N/A'}</p>
          <p><strong>Paper No.:</strong> {data.paperNo || 'N/A'}</p>
          <p><strong>Question Number:</strong> {data.questionNumber || 'N/A'}</p>

          <h3 className="preview-subtitle">Question Text:</h3>
          <div
            className="preview-text"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.questionText || 'N/A') }}
          />

          {data.answerText && (
            <>
              <h3 className="preview-subtitle">Answer Text:</h3>
              <div
                className="preview-text"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.answerText || 'N/A') }}
              />
            </>
          )}

          <p><strong>Page Number:</strong> {data.pageNumber || 'N/A'}</p>

          {data.subQuestions && data.subQuestions.length > 0 && (
            <div>
              <h3 className="preview-subtitle">Sub-Questions:</h3>
              {data.subQuestions.map((subQ, subIdx) => (
                <div
                  key={subIdx}
                  className="preview-subquestion"
                >
                  <p><strong>Sub Question Number:</strong> {subQ.subQuestionNumber || 'N/A'}</p>
                  <p><strong>Sub Question Text:</strong> {subQ.subQuestionText || 'N/A'}</p>
                  {subQ.subOptions && subQ.subOptions.length > 0 && (
                    <div>
                      <h4 className="preview-subheading">Sub MCQ Options:</h4>
                      <ul className="preview-options">
                        {subQ.subOptions.map((subOpt, optIdx) => (
                          <li key={optIdx}>
                            {subOpt.optionText || 'N/A'}{' '}
                            {subOpt.isCorrect && <span className="preview-correct">Correct</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preview content ends here */}
        </div>

        <button
          onClick={onClose}
          className="preview-close-btn"
        >
          Close Preview
        </button>
      </div>
    </>
  );
};

export default PreviewPanel;