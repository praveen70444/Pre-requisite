import React, { useState } from "react";
import { Plus, Trash2, Edit, BookOpen, Search, MessageSquare, X } from "lucide-react";
import { FaFileAlt, FaVideo } from "react-icons/fa";
import CourseComments from "../../../components/course/CourseComments";

const CourseListView = ({
  loading,
  courses,
  selectedCourse,
  onOpenCourse,
  onBack,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCourseForComments, setSelectedCourseForComments] = useState(null);

  const openCommentsModal = (course, e) => {
    e.stopPropagation();
    setSelectedCourseForComments(course);
    setCommentsModalOpen(true);
  };

  const closeCommentsModal = () => {
    setCommentsModalOpen(false);
    setSelectedCourseForComments(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
      case "pending":
        return "bg-amber-100 dark:bg-amber-600 text-amber-700 dark:text-amber-300";
      case "rejected":
        return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium animate-pulse">
        Loading library...
      </div>
    );
  if (selectedCourse) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <button
          onClick={onBack}
          className="mb-4 text-sm font-semibold text-indigo-600 hover:underline"
        >
          ← Back to Courses
        </button>

        <h2 className="text-xl font-bold mb-4">{selectedCourse.title}</h2>
        {selectedCourse.modules.length === 0 ? (
          <div className="empty-state-container">No modules added yet.</div>
        ) : (
          selectedCourse.modules.map((m, idx) => (
            <div
              key={m.module_id}
              className="file-list-item clickable"
              onClick={() =>
                window.open(m.content_url, "_blank", "noopener,noreferrer")
              }
            >
              <div className="file-index-circle">{idx + 1}</div>

              <div className="file-info">
                {m.type === "video" ? (
                  <FaVideo className="file-icon-sm video" />
                ) : (
                  <FaFileAlt className="file-icon-sm pdf" />
                )}

                <span className="file-name-row">{m.title}</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#000000] p-2 font-sans text-primary-900 dark:text-[#e5e7eb] flex flex-col">
      <div className="w-full space-y-4 flex-1 flex flex-col">
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 border-b border-slate-200 dark:border-[#1a1a1a] pb-4 shrink-0 bg-white dark:bg-[#0a0a0a] px-6 py-4 rounded-lg shadow-sm border border-slate-200 dark:border-[#2a2a2a]">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ffffff] tracking-tight">
              Course Library
            </h1>
            <p className="text-slate-600 dark:text-[#d1d5db] text-sm mt-1">
              Manage and update your published content.
            </p>
          </div>
          <button
            className="bg-primary-900 dark:bg-[#22c55e] hover:bg-slate-800 dark:hover:bg-[#16a34a] text-white font-semibold py-2 px-6 rounded-md shadow-sm flex items-center gap-2 text-sm hover:scale-105 transition-all duration-200"
            onClick={onCreate}
          >
            <Plus size={16} /> Create New Course
          </button>
        </div>

        {/* --- Data Table Section --- */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#2a2a2a] rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-slate-700 dark:border-[#2a2a2a] flex justify-between items-center bg-slate-800 dark:bg-[#1a1a1a] shrink-0">
            <h3 className="text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide">
              My Courses ({courses.length})
            </h3>
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-[#9ca3af]"
                size={16}
              />
              <input
                type="text"
                placeholder="Filter courses..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-600 dark:border-[#2a2a2a] bg-slate-700 dark:bg-[#1a1a1a] text-white dark:text-[#e5e7eb] placeholder-slate-300 dark:placeholder-[#6b7280] rounded-md focus:border-slate-500 dark:focus:border-[#22c55e] focus:ring-0 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse h-full">
              <thead className="bg-slate-800 dark:bg-[#1a1a1a] border-b border-slate-700 dark:border-[#3a3a3a] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide">
                    Course Title
                  </th>
                  <th className="px-6 py-3 text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide h-hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-6 py-3 text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide text-right">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-sm font-bold text-white dark:text-[#ffffff] uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                {courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-slate-500 dark:text-[#9ca3af]"
                    >
                      <BookOpen
                        size={48}
                        className="mx-auto mb-4 text-slate-300 dark:text-[#4b5563]"
                        strokeWidth={1}
                      />
                      <p className="text-sm">
                        No courses found. Create one to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr
                      key={course.courses_id}
                      onClick={() => onOpenCourse(course)}
                      className="cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-[#ffffff] text-sm">
                          {course.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-[#d1d5db] mt-0.5 md:hidden">
                          {course.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-[#d1d5db] hidden md:table-cell">
                        {course.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-[#d1d5db] tabular-nums">
                        {course.modules ? course.modules.length : 0}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(course.status)}`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => openCommentsModal(course, e)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-indigo-600 dark:bg-[#22c55e] hover:bg-indigo-700 dark:hover:bg-[#16a34a] rounded-md transition-colors font-medium shadow-sm"
                        >
                          <MessageSquare size={16} />
                          View
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-[#d1d5db] text-right tabular-nums">
                        {course.created_at
                          ? new Date(course.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(course);
                            }}
                            className="p-2 text-white bg-indigo-600 dark:bg-[#22c55e] hover:bg-indigo-700 dark:hover:bg-[#16a34a] rounded-md transition-colors shadow-sm"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(course.courses_id);
                            }}
                            disabled={course.status === "approved"}
                            className={`p-2 rounded-md transition-colors shadow-sm ${course.status === "approved" ? "bg-slate-300 dark:bg-[#2a2a2a] text-slate-500 dark:text-[#6b7280] cursor-not-allowed" : "bg-rose-600 dark:bg-rose-600 text-white hover:bg-rose-700 dark:hover:bg-rose-700"}`}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {commentsModalOpen && selectedCourseForComments && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-[#2a2a2a]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#2a2a2a] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-[#e5e7eb]">
                  Course Discussion
                </h2>
                <p className="text-sm text-slate-500 dark:text-[#9ca3af] mt-1">
                  {selectedCourseForComments.title}
                </p>
              </div>
              <button
                onClick={closeCommentsModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-[#e5e7eb] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              <CourseComments courseId={selectedCourseForComments.courses_id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseListView;
