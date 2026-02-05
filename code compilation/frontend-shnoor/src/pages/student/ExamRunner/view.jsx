import React from "react";
import {
  FaClock,
  FaAngleLeft,
  FaAngleRight,
  FaTrophy,
  FaTimesCircle,
  FaCheckCircle,
  FaCode,
} from "react-icons/fa";
import PracticeSession from "../PracticeSession.jsx";
import EvaluationResults from "../../../components/exam/EvaluationResults.jsx";

const ExamRunnerView = ({
  loading,
  exam,
  currentQIndex,
  setCurrentQIndex,
  answers,
  handleAnswer,
  timeLeft,
  isSubmitted,
  result,
  handleSubmit,
  formatTime,
  navigate,
  isSubmitting = false,
  examId,
}) => {
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Assessment...</p>
        </div>
      </div>
    );
  if (!exam)
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Exam not found.
      </div>
    );

  if (isSubmitted && result) {
    const isUnchanged = result.unchanged === true;
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 font-sans p-6">
        <div className="bg-white p-12 rounded-lg shadow-sm border border-slate-200 w-full max-w-4xl">
          {isUnchanged && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
              {result.message || "Your previous attempt had a higher or equal score; result unchanged."}
            </div>
          )}
          {result.passed ? (
            <div className="space-y-8">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <FaTrophy size={40} />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Assessment Passed
                </h2>
                <p className="text-slate-500">
                  You successfully completed{" "}
                  <strong className="text-slate-900">{exam.title}</strong>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 text-center">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Final Score
                </div>
                <div className="text-5xl font-bold text-indigo-600 tracking-tight">
                  {result.percentage}%
                </div>
                <div className="text-sm text-slate-600 mt-2">
                  {result.obtainedMarks} / {result.totalMarks} marks
                </div>
              </div>

              {/* Show evaluation results for coding questions */}
              {result.evaluationResults && result.evaluationResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FaCode /> Coding Question Results
                  </h3>
                  {result.evaluationResults.map((evalResult, idx) => (
                    <EvaluationResults
                      key={idx}
                      evaluationResult={evalResult.evaluationResult}
                      questionTitle={evalResult.questionTitle}
                      showHidden={true}
                    />
                  ))}
                </div>
              )}

              <div className="text-xs font-medium text-slate-400 text-center">
                A certificate has been generated for your records.
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm"
                  onClick={() => navigate("/student/dashboard")}
                >
                  Return Home
                </button>
                <button
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all text-sm shadow-sm"
                  onClick={() => navigate("/student/certificates")}
                >
                  View Certificate
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <FaTimesCircle size={40} />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Assessment Failed
                </h2>
                <p className="text-slate-500">
                  You did not meet the passing criteria for this exam.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 text-center">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Your Score
                </div>
                <div className="text-5xl font-bold text-rose-500 tracking-tight">
                  {result.percentage}%
                </div>
                <div className="text-xs font-bold text-slate-400 mt-2">
                  Required: {exam.pass_score}%
                </div>
                <div className="text-sm text-slate-600 mt-2">
                  {result.obtainedMarks} / {result.totalMarks} marks
                </div>
              </div>

              {/* Show evaluation results for coding questions */}
              {result.evaluationResults && result.evaluationResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FaCode /> Coding Question Results
                  </h3>
                  {result.evaluationResults.map((evalResult, idx) => (
                    <EvaluationResults
                      key={idx}
                      evaluationResult={evalResult.evaluationResult}
                      questionTitle={evalResult.questionTitle}
                      showHidden={true}
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm"
                  onClick={() => navigate("/student/dashboard")}
                >
                  Return Home
                </button>
                <button
                  className="px-6 py-2.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-all text-sm shadow-sm"
                  onClick={() => window.location.reload()}
                >
                  Retake Exam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No questions found for this exam.
      </div>
    );
  }

  const currentQ = exam.questions[currentQIndex];
  const questionId = currentQ.question_id || currentQ.id;
  const isPractice = exam.duration === 0;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-slate-50">
      {}
      <div className="h-16 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0 shadow-md z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.confirm("Quit exam? Progress will be lost."))
                navigate(-1);
            }}
            className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
          >
            <FaAngleLeft size={20} />{" "}
            <span className="text-sm font-medium">Exit</span>
          </button>
          <div className="h-6 w-px bg-white/20"></div>
          <h3 className="text-lg font-bold truncate max-w-md">{exam.title}</h3>
        </div>

        {!isPractice && (
          <div className="flex items-center gap-4">
            <span
              className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-mono font-bold text-lg border transition-all ${
                timeLeft < 300
                  ? "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse"
                  : "bg-white/10 text-white border-white/10"
              }`}
            >
              <FaClock size={16} /> {formatTime(timeLeft)}
            </span>
            <button
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSubmitting || isSubmitted}
            >
              {isSubmitting ? "Submitting..." : "Finish Test"}
            </button>
          </div>
        )}
      </div>

      {}
      <div className="flex flex-1 overflow-hidden">
        {}
        <div className="w-64 bg-white border-r border-slate-200 flex-col p-6 overflow-y-auto hidden md:flex">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
            Progress
          </div>

          <div className="grid grid-cols-4 gap-2 mb-8">
            {exam.questions.map((q, idx) => {
              let statusClass =
                "bg-slate-100 text-slate-500 hover:bg-slate-200";
              if (idx === currentQIndex)
                statusClass =
                  "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2";
              else if (answers[q.question_id || q.id])
                statusClass =
                  "bg-emerald-100 text-emerald-700 border border-emerald-200";

              return (
                <button
                  key={q.id || q.question_id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all ${statusClass}`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-auto space-y-3 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-blue-600 ring-2 ring-blue-600 ring-offset-1"></div>{" "}
              Current
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>{" "}
              Answered
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-slate-100"></div> Unvisited
            </div>
          </div>
        </div>

        {}
        <div
          className={`flex-1 overflow-y-auto ${currentQ.type === "coding" ? "p-0" : "p-6 md:p-10"} flex flex-col items-center bg-slate-50/50`}
        >
          {currentQ.type === "descriptive" ? (
            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full md:h-auto min-h-125">
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start gap-4">
                <div>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                    Question {currentQIndex + 1}
                  </span>
                  <p className="text-xl md:text-2xl font-medium text-slate-800 mt-2 leading-relaxed">
                    {currentQ.text}
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold whitespace-nowrap">
                  {currentQ.marks} Marks
                </span>
              </div>

              <div className="p-6 md:p-8 flex-1">
                <textarea
                  className="w-full h-full min-h-75 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all text-lg"
                  placeholder="Type your answer here..."
                  value={answers[questionId] || ""}
                  onChange={(e) => handleAnswer(questionId, e.target.value)}
                />
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-b-2xl">
                <button
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all ${currentQIndex === 0 ? "invisible" : ""}`}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                >
                  <FaAngleLeft /> Previous
                </button>

                {currentQIndex < exam.questions.length - 1 ? (
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  >
                    Next <FaAngleRight />
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSubmitted}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                  </button>
                )}
              </div>
            </div>
          ) : currentQ.type === "coding" ? (
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 overflow-hidden relative">
                <PracticeSession
                  question={currentQ}
                  value={answers[questionId]}
                  onChange={(val) => handleAnswer(questionId, val)}
                  onComplete={() => {}}
                  examId={examId}
                  questionId={questionId}
                />
              </div>
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center shrink-0">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${currentQIndex === 0 ? "invisible" : ""}`}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                >
                  <FaAngleLeft /> Previous
                </button>
                {currentQIndex < exam.questions.length - 1 ? (
                  <button
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-all"
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  >
                    Next <FaAngleRight />
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full md:h-auto overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start gap-4 bg-slate-50/50">
                <div>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                    Question {currentQIndex + 1}
                  </span>
                  <p className="text-xl md:text-2xl font-medium text-slate-800 mt-2 leading-relaxed">
                    {currentQ.text}
                  </p>
                </div>
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold whitespace-nowrap shadow-sm">
                  {currentQ.marks} Marks
                </span>
              </div>

              <div className="p-6 md:p-8 flex-1 grid gap-4">
                {(currentQ.options || []).map((opt, i) => {
                  // Handle both old format (string) and new format (object with option_id)
                  const optionText = typeof opt === 'string' ? opt : opt.option_text;
                  const optionId = typeof opt === 'object' ? opt.option_id : null;
                  const answerValue = answers[questionId];
                  const isSelected = optionId 
                    ? (typeof answerValue === 'object' ? answerValue?.option_id === optionId : false)
                    : (answerValue === optionText);

                  return (
                    <label
                      key={i}
                      className={`group flex items-center gap-4 p-4 md:p-5 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-slate-300 group-hover:border-indigo-400"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name={`q-${currentQ.id || currentQ.question_id}`}
                        value={optionId || optionText}
                        checked={isSelected}
                        onChange={() => handleAnswer(questionId, optionId ? { option_id: optionId, option_text: optionText } : optionText)}
                        className="hidden"
                      />
                      <span
                        className={`text-lg transition-colors ${
                          isSelected
                            ? "text-blue-700 font-bold"
                            : "text-slate-600 font-medium group-hover:text-slate-800"
                        }`}
                      >
                        {optionText}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                <button
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all ${currentQIndex === 0 ? "invisible" : ""}`}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                >
                  <FaAngleLeft /> Previous
                </button>

                {currentQIndex < exam.questions.length - 1 ? (
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  >
                    Next <FaAngleRight />
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSubmitted}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamRunnerView;
