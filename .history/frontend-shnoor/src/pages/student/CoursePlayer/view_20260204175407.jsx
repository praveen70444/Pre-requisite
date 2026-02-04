import React from "react";
import {
  CheckCircle,
  ArrowLeft,
  FileText,
  Play,
  ExternalLink,
  Info,
} from "lucide-react";

const toEmbedUrl = (url) => {
  if (!url) return "";

  // Already embed
  if (url.includes("youtube.com/embed")) return url;

  // watch?v=
  const watchMatch = url.match(/v=([^&]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // youtu.be/
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return url; // fallback
};

const CoursePlayerView = ({
  course,
  currentModule,
  setCurrentModule,
  loading,
  progressPercentage,
  isModuleCompleted,
  handleMarkComplete,
  navigate,
  courseId,
}) => {
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium tracking-wide">
            Loading classroom...
          </p>
        </div>
      </div>
    );

  if (!course)
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <button
            onClick={() => navigate("/student/courses")}
            className="text-indigo-400 hover:text-blue-300 underline"
          >
            Return to courses
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-primary-900 text-slate-100 overflow-hidden font-sans">
      {}
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/student/courses")}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Back to Courses"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          <h1 className="font-bold text-lg text-white truncate max-w-md">
            {course.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Progress
          </div>
          <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm font-bold text-indigo-400 w-10 text-right">
            {progressPercentage}%
          </div>
        </div>
      </div>

      {/* Pre-requirements banner */}
      {(course.prereq_description ||
        (course.prereq_video_urls && course.prereq_video_urls.length > 0) ||
        course.prereq_pdf_url) && (
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 text-xs flex flex-wrap gap-4 items-center">
          <div className="font-semibold text-slate-200 flex items-center gap-2">
            <Info size={14} className="text-indigo-400" />
            Pre‑course requirements
          </div>
          {course.prereq_description && (
            <p className="text-slate-300 max-w-3xl">
              {course.prereq_description}
            </p>
          )}
          <div className="ml-auto flex gap-3">
            {course.prereq_video_urls && course.prereq_video_urls.map((videoUrl, index) => (
              <a
                key={index}
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition text-[11px]"
              >
                <Play size={12} />
                Video {index + 1}
              </a>
            ))}
            {course.prereq_pdf_url && (
              <a
                href={course.prereq_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold transition text-[11px]"
              >
                <FileText size={12} />
                Download PDF
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {}
        <div className="flex-1 flex flex-col relative bg-black">
          {}
          <div className="flex-1 relative">
            {currentModule?.type === "video" ? (
              currentModule.url.includes("firebasestorage") ||
              currentModule.url.match(/\.(mp4|webm|ogg)$/) ? (
                <video
                  controls
                  className="w-full h-full object-contain bg-black"
                >
                  <source src={currentModule.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  className="w-full h-full absolute top-0 left-0"
                  src={toEmbedUrl(currentModule.url)}
                  title="Video Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-slate-800 text-slate-300 p-8">
                <FileText size={64} className="text-slate-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Document Viewer
                </h3>
                <p className="text-lg mb-8">{currentModule?.title}</p>
                <a
                  href={currentModule?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                  Open Document <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

          {}
          <div className="h-20 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-8 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white">
                {currentModule?.title}
              </h2>
              <p className="text-sm text-slate-400">
                {currentModule?.type === "video"
                  ? "Video Lesson"
                  : "Reading Material"}
              </p>
            </div>
            <button
              onClick={handleMarkComplete}
              disabled={isModuleCompleted(currentModule?.id)}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                isModuleCompleted(currentModule?.id)
                  ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
                  : "bg-primary-900 hover:bg-slate-800 text-white shadow-lg shadow-primary-900/20"
              }`}
            >
              {isModuleCompleted(currentModule?.id) ? (
                <>
                  <CheckCircle size={16} /> Completed
                </>
              ) : (
                "Mark as Complete"
              )}
            </button>
          </div>
        </div>

        {}
        <div className="w-80 bg-primary-900 border-l border-slate-700 flex flex-col flex-shrink-0 shadow-2xl z-10">
          <div className="p-4 bg-slate-800 border-b border-slate-700">
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-xs">
              Course Content
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {course.modules?.map((module, index) => {
              const isActive = currentModule?.id === module.id;
              const isCompleted = isModuleCompleted(module.id);

              return (
                <div
                  key={module.id}
                  onClick={() => setCurrentModule(module)}
                  className={`p-4 border-b border-slate-800 cursor-pointer transition-all hover:bg-slate-800/50 group relative ${
                    isActive ? "bg-slate-800" : ""
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                  )}

                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="text-green-500" size={16} />
                      ) : (
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isActive
                              ? "border-indigo-600"
                              : "border-slate-600 group-hover:border-slate-500"
                          }`}
                        >
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <h5
                        className={`text-sm font-medium mb-1 leading-snug ${
                          isActive
                            ? "text-white"
                            : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {module.title}
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          {module.type === "video" ? (
                            <Play size={8} fill="currentColor" />
                          ) : (
                            <FileText size={8} />
                          )}
                          <span className="capitalize">{module.type}</span>
                        </span>
                        {module.duration && <span>• {module.duration}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <button
              className="w-full py-3 bg-primary-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-primary-900/20 transition-all transform hover:-translate-y-0.5"
              onClick={() => navigate(`/student/exam/final_${courseId}`)}
            >
              Take Final Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayerView;
