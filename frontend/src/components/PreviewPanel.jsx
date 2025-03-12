import React from 'react';
import DOMPurify from 'dompurify';

const PreviewPanel = ({ data, onClose }) => {
  // Log the data to debug
  console.log('Preview Data:', data);

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[999] backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 p-6 z-[1000] max-h-[80%] overflow-y-auto w-full max-w-2xl rounded-lg shadow-lg text-black"
      >
        <h2 className="text-2xl font-bold mb-4">Preview</h2>
        <div className="space-y-4">
          <p><strong>Subject:</strong> {data.subject || 'N/A'}</p>
          <p><strong>Exam Type:</strong> {data.examType || 'N/A'}</p>
          <p><strong>Year:</strong> {data.year || 'N/A'}</p>
          <p><strong>Month:</strong> {data.month || 'N/A'}</p>
          <p><strong>Group:</strong> {data.group || 'N/A'}</p>
          <p><strong>Paper Name:</strong> {data.paperName || 'N/A'}</p>
          <p><strong>Question Number:</strong> {data.questionNumber || 'N/A'}</p>

          <h3 className="text-lg font-semibold mt-4">Question Text:</h3>
          <div
            className="border border-gray-300 p-4 rounded-lg prose prose-blue max-w-none text-black"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.questionText || 'N/A') }}
          />

          {data.answerText && (
            <>
              <h3 className="text-lg font-semibold mt-4">Answer Text:</h3>
              <div
                className="border border-gray-300 p-4 rounded-lg prose prose-blue max-w-none text-black"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.answerText || 'N/A') }}
              />
            </>
          )}

          <p><strong>Page Number:</strong> {data.pageNumber || 'N/A'}</p>

          {data.subQuestions && data.subQuestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mt-4">Sub-Questions:</h3>
              {data.subQuestions.map((subQ, subIdx) => (
                <div
                  key={subIdx}
                  className="mt-4 border-t border-gray-300 pt-4"
                >
                  <p><strong>Sub Question Number:</strong> {subQ.subQuestionNumber || 'N/A'}</p>
                  <p><strong>Sub Question Text:</strong> {subQ.subQuestionText || 'N/A'}</p>
                  {subQ.subOptions && subQ.subOptions.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold mt-2">Sub MCQ Options:</h4>
                      <ul className="list-disc pl-5 mt-2">
                        {subQ.subOptions.map((subOpt, optIdx) => (
                          <li key={optIdx}>
                            {subOpt.optionText || 'N/A'}{' '}
                            {subOpt.isCorrect && <span className="text-green-500 font-bold">(Correct)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Debugging: Display raw data */}
          <pre className="mt-4 p-4 bg-gray-100 rounded-lg overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close Preview
        </button>
      </div>
    </>
  );
};

export default PreviewPanel;