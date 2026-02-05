import React from "react";
import { ClipboardList, Play, Clock, AlertCircle } from "lucide-react";

const StudentExamsView = ({ loading, exams, navigate }) => {
  const maxAttempts = (exam) => exam.max_attempts != null ? Number(exam.max_attempts) : 1;
  const attemptsUsed = (exam) => (exam.attempts_used != null ? Number(exam.attempts_used) : 0);
  const noAttemptsLeft = (exam) => attemptsUsed(exam) >= maxAttempts(exam);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900">My Exams</h3>
        <p className="text-slate-500 mt-1">
          Take assessments to prove your skills. You can attempt each exam only as many times as the instructor allows.
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <ClipboardList className="text-slate-300 w-16 h-16 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            No Exams Available
          </h3>
          <p className="text-slate-500">
            There are no exams available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {exams.map((exam) => {
            const disabled = noAttemptsLeft(exam);
            const used = attemptsUsed(exam);
            const max = maxAttempts(exam);
            return (
              <div
                key={exam.exam_id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-indigo-300 hover:shadow-md transition-all duration-300"
              >
               
                <div className="h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center">
                  <ClipboardList className="text-indigo-300 w-12 h-12" />
                </div>

                
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="text-base font-bold text-slate-900 mb-3 line-clamp-2">
                    {exam.title}
                  </h4>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
                    <Clock size={12} />
                    {exam.duration} minutes
                  </div>

                  <div className="text-xs text-slate-500 mb-2">
                    Pass Score: <span className="font-bold">{exam.pass_percentage}%</span>
                  </div>

                  <div className="text-xs text-slate-600 mb-4">
                    Attempts: <span className="font-semibold">{used} / {max}</span>
                  </div>

                  {disabled ? (
                    <div className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                      <AlertCircle size={16} />
                      No attempts left
                    </div>
                  ) : (
                    <button
                      className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded text-sm transition-all flex items-center justify-center gap-2"
                      onClick={() => navigate(`/student/exam/${exam.exam_id}`)}
                    >
                      <Play size={14} fill="currentColor" /> Start Exam
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentExamsView;

