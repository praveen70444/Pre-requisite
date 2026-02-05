import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const EvaluationResults = ({ evaluationResult, questionTitle, showHidden = false }) => {
  if (!evaluationResult || !evaluationResult.testResults) {
    return null;
  }

  const { testResults, summary } = evaluationResult;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Evaluation Results</h3>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            summary.percentage === 100 
              ? 'bg-green-100 text-green-700' 
              : summary.percentage >= 50 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {summary.passedTestCases}/{summary.totalTestCases} Test Cases Passed
          </span>
          <span className="text-sm font-bold text-slate-600">
            ({summary.percentage}%)
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {testResults.map((test, index) => {
          const isHidden = test.isHidden && !showHidden;
          const passed = test.passed;

          return (
            <div
              key={index}
              className={`border-2 rounded-lg p-4 ${
                passed
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {passed ? (
                    <FaCheckCircle className="text-green-600" size={20} />
                  ) : (
                    <FaTimesCircle className="text-red-600" size={20} />
                  )}
                  <span className="font-bold text-slate-900">
                    Test Case {index + 1}
                  </span>
                  {isHidden && (
                    <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded flex items-center gap-1">
                      <FaEyeSlash size={10} /> Hidden
                    </span>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    passed
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                    Input
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-2 font-mono text-sm break-words">
                    {isHidden ? '[Hidden Test Case]' : (test.input || 'No input')}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                    Expected Output
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-2 font-mono text-sm break-words">
                    {isHidden ? '[Hidden Test Case]' : (test.expectedOutput || 'No expected output')}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                    Actual Output
                  </div>
                  <div
                    className={`bg-white border-2 rounded p-2 font-mono text-sm break-words ${
                      passed
                        ? 'border-green-300'
                        : 'border-red-300'
                    }`}
                  >
                    {test.error ? (
                      <span className="text-red-600">{test.error}</span>
                    ) : (
                      test.actualOutput !== null && test.actualOutput !== undefined
                        ? test.actualOutput
                        : 'No output'
                    )}
                  </div>
                </div>
              </div>

              {test.error && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                  <strong>Error:</strong> {test.error}
                </div>
              )}

              {test.executionTime && (
                <div className="mt-2 text-xs text-slate-500">
                  Execution time: {test.executionTime}ms
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-600">Summary</div>
            <div className="text-xs text-slate-500">
              {summary.passedTestCases} out of {summary.totalTestCases} test cases passed
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {summary.percentage}%
            </div>
            <div className="text-xs text-slate-500">Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationResults;
