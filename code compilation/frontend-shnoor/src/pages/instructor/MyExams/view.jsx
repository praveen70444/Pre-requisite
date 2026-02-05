import React from "react";
import { BookOpen, Users, ChevronRight, X, CheckCircle, XCircle, Plus, Eye, ListChecks, Trash2 } from "lucide-react";

const MyExamsView = ({
  exams,
  loading,
  selectedExamId,
  results,
  resultsLoading,
  onViewResults,
  onCloseResults,
  onCreateExam,
  onViewContent,
  viewContentExamId,
  examDetails,
  detailsLoading,
  onCloseContent,
  onDeleteExam,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium animate-pulse">
        Loading your exams...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-primary-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header: title left, Create Exam right */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Exams
            </h1>
            <p className="text-slate-500 mt-1">
              Create exams and view the ones you created, with student attempts and pass/fail status.
            </p>
          </div>
          <button
            onClick={onCreateExam}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm shrink-0 ml-auto sm:ml-0"
          >
            <Plus size={20} />
            Create Exam
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-600 font-medium">No exams yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Create your first exam to get started.
            </p>
            <button
              onClick={onCreateExam}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Create Exam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.exam_id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-indigo-300 hover:shadow-md transition-all duration-300"
              >
                <div className="h-36 bg-slate-50 border-b border-slate-100 flex items-center justify-center">
                  <BookOpen className="text-indigo-300 w-12 h-12" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                    {exam.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <span>{exam.duration} min</span>
                    <span>•</span>
                    <span>Pass: {exam.pass_percentage}%</span>
                    {exam.max_attempts != null && (
                      <>
                        <span>•</span>
                        <span>{exam.max_attempts} attempt(s)</span>
                      </>
                    )}
                  </div>
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewContent(exam.exam_id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => onDeleteExam(exam.exam_id, exam.title)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete exam"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <button
                      onClick={() => onViewResults(exam.exam_id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
                    >
                      <Users size={16} />
                      View attempts & results
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results modal */}
        {selectedExamId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {results?.exam?.title || "Exam results"}
                </h3>
                <button
                  onClick={onCloseResults}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {resultsLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    Loading results...
                  </div>
                ) : results?.students?.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Users size={40} className="mx-auto text-slate-300 mb-2" />
                    <p>No students have attempted this exam yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-3 font-semibold text-slate-600">Student</th>
                          <th className="text-left py-3 px-3 font-semibold text-slate-600">Email</th>
                          <th className="text-right py-3 px-3 font-semibold text-slate-600">Marks</th>
                          <th className="text-right py-3 px-3 font-semibold text-slate-600">%</th>
                          <th className="text-center py-3 px-3 font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results?.students?.map((row) => (
                          <tr key={row.student_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-medium text-slate-900">{row.student_name}</td>
                            <td className="py-3 px-3 text-slate-600">{row.student_email}</td>
                            <td className="py-3 px-3 text-right font-mono">
                              {row.obtained_marks != null ? row.obtained_marks : "—"} / {row.total_marks ?? "—"}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-medium">
                              {row.percentage != null ? `${row.percentage}%` : "—"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {row.passed === true ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                  <CheckCircle size={14} /> Pass
                                </span>
                              ) : row.passed === false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                                  <XCircle size={14} /> Fail
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {results?.exam?.pass_percentage != null && (
                  <p className="text-xs text-slate-500 mt-3">
                    Pass threshold: {results.exam.pass_percentage}%
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View exam content modal (questions) */}
        {viewContentExamId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {examDetails?.title || "Exam content"}
                </h3>
                <button
                  onClick={onCloseContent}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    Loading questions...
                  </div>
                ) : !examDetails?.questions?.length ? (
                  <div className="text-center py-12 text-slate-500">
                    <ListChecks size={40} className="mx-auto text-slate-300 mb-2" />
                    <p>No questions in this exam yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {examDetails.questions.map((q, idx) => (
                      <div
                        key={q.question_id}
                        className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">
                            Question {idx + 1} • {q.question_type}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-bold">
                            {q.marks} marks
                          </span>
                        </div>
                        {q.question_type === "mcq" && (
                          <>
                            <p className="text-slate-800 font-medium mb-2">{q.question_text}</p>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                              {(q.options || []).map((opt, i) => (
                                <li key={i}>
                                  {typeof opt === "object" ? opt.option_text : opt}
                                  {typeof opt === "object" && opt.is_correct && (
                                    <span className="ml-2 text-emerald-600 font-medium">(correct)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {q.question_type === "descriptive" && (
                          <p className="text-slate-800 font-medium">{q.question_text}</p>
                        )}
                        {q.question_type === "coding" && (
                          <>
                            <p className="text-slate-800 font-bold mb-1">{q.coding_title || "Coding"}</p>
                            <p className="text-slate-600 text-sm mb-2">{q.coding_description || "—"}</p>
                            <p className="text-xs text-slate-500">Language: {q.coding_language || "—"}</p>
                            {(q.test_cases || []).length > 0 && (
                              <div className="mt-2 text-xs text-slate-500">
                                {q.test_cases.length} test case(s)
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyExamsView;
