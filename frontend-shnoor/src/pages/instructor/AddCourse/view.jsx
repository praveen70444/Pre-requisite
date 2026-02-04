import React from 'react';
import { Plus, Video, FileText, ArrowRight, ArrowLeft, Save, Trash2, Check, ArrowUp, ArrowDown, Info, Minus } from 'lucide-react';

const AddCourseView = ({
    step, setStep, loading,
    courseData, handleCourseChange,
    moduleForm, handleModuleChange,
    isCustomCategory,
    videoInputType, setVideoInputType,
    pdfInputType, setPdfInputType,
    handleFileUpload, uploading, uploadProgress,
    addModule, removeModule, moveModule,
    handleSubmit, editCourseId,
    addVideoUrl, removeVideoUrl, updateVideoUrl
}) => {

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium animate-pulse">
            Processing course data...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-2 font-sans text-primary-900 flex flex-col">
            <div className="w-full max-w-none space-y-4 flex-1 flex flex-col">

                {/* --- Header Section --- */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 border-b border-slate-200 pb-4 shrink-0 bg-white px-6 py-4 rounded-lg shadow-sm border">
                    <div>
                        <h1 className="text-2xl font-bold text-primary-900 tracking-tight">
                            {editCourseId ? 'Edit Course' : 'Create New Course'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Configure course details and curriculum.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${step >= s ? 'bg-primary-900 text-white border-primary-900' : 'bg-white text-slate-400 border-slate-200'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && <div className={`w-8 h-0.5 mx-1 transition-all ${step > s ? 'bg-primary-900' : 'bg-slate-200'}`}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 p-6">

                    {/* STEP 1: Course Details */}
                    {step === 1 && (
                        <div className="w-full">
                            <h3 className="text-lg font-bold text-primary-900 border-b border-slate-100 pb-4 mb-6 uppercase tracking-wide text-sm flex items-center gap-2">
                                <Info className="text-slate-400" size={16} /> Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Course Title <span className="text-rose-500">*</span></label>
                                        <input
                                            name="title"
                                            placeholder="e.g. Advanced System Design"
                                            value={courseData.title}
                                            onChange={handleCourseChange}
                                            autoFocus
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all font-medium text-primary-900 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                                        <textarea
                                            name="description"
                                            rows="5"
                                            placeholder="Overview of learning outcomes..."
                                            value={courseData.description}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all font-medium text-primary-900 text-sm resize-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thumbnail URL</label>
                                        <input
                                            name="thumbnail"
                                            placeholder="https://..."
                                            value={courseData.thumbnail}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all font-medium text-primary-900 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category <span className="text-rose-500">*</span></label>
                                        <select
                                            name="category"
                                            value={isCustomCategory ? 'custom' : courseData.category}
                                            onChange={handleCourseChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-700 text-sm cursor-pointer"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Web Development">Web Development</option>
                                            <option value="DevOps">DevOps</option>
                                            <option value="Data Science">Data Science</option>
                                            <option value="Business">Business</option>
                                            <option value="Design">Design</option>
                                            <option value="custom">+ Add New</option>
                                        </select>
                                    </div>

                                    {isCustomCategory && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-xs font-bold text-indigo-600 uppercase tracking-wide">New Category Name</label>
                                            <input
                                                name="customCategory"
                                                placeholder="Enter category name"
                                                value={courseData.customCategory}
                                                onChange={handleCourseChange}
                                                className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Level <span className="text-rose-500">*</span></label>
                                            <select
                                                name="level"
                                                value={courseData.level}
                                                onChange={handleCourseChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-slate-700 text-sm"
                                            >
                                                <option value="">Select Level</option>
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Validity <span className="text-rose-500">*</span></label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    name="validity_value"
                                                    value={courseData.validity_value}
                                                    onChange={handleCourseChange}
                                                    className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                />
                                                <select
                                                    name="validity_unit"
                                                    value={courseData.validity_unit}
                                                    onChange={handleCourseChange}
                                                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                >
                                                    <option value="days">Days</option>
                                                    <option value="months">Months</option>
                                                    <option value="years">Years</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pre-requirements editor (right side) */}
                                    <div className="mt-4 space-y-4 border border-slate-200 rounded-md p-4 bg-slate-50">
                                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                                            <Info size={14} className="text-indigo-500" />
                                            Pre-requirements for this course
                                        </h4>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">
                                                Concepts students should know before starting
                                            </label>
                                            <textarea
                                                name="prereq_description"
                                                rows="3"
                                                placeholder="e.g. Basic Python syntax, linear algebra fundamentals..."
                                                value={courseData.prereq_description}
                                                onChange={handleCourseChange}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-semibold text-slate-500">
                                                    Recommended Video Links
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={addVideoUrl}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Plus size={12} />
                                                    Add Video
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {courseData.prereq_video_urls.map((url, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            placeholder={`Video ${index + 1}: https://youtube.com/...`}
                                                            value={url}
                                                            onChange={(e) => updateVideoUrl(index, e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-xs"
                                                        />
                                                        {courseData.prereq_video_urls.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVideoUrl(index)}
                                                                className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">
                                                PDF Links
                                            </label>
                                            <input
                                                name="prereq_pdf_url"
                                                placeholder="https://... (public PDF link)"
                                                value={courseData.prereq_pdf_url}
                                                onChange={handleCourseChange}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none text-xs"
                                            />
                                        
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <button
                                    className="bg-primary-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    onClick={() => setStep(2)}
                                    disabled={!courseData.title || (!courseData.category && !courseData.customCategory) || !courseData.level}
                                >
                                    Proceed to Curriculum <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Curriculum */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                            {/* Left: Module Form */}
                            <div className="lg:col-span-1 border-r border-slate-200 pr-8">
                                <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wide mb-6">Add Module Content</h3>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">Title</label>
                                        <input
                                            name="title"
                                            placeholder="Module Name"
                                            value={moduleForm.title}
                                            onChange={handleModuleChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">Type</label>
                                            <select
                                                name="type"
                                                value={moduleForm.type}
                                                onChange={handleModuleChange}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                            >
                                                <option value="video">Video</option>
                                                <option value="pdf">PDF</option>
                                            </select>
                                        </div>
                                        {moduleForm.type === 'video' && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-500">Duration (m)</label>
                                                <input
                                                    type="number"
                                                    name="duration"
                                                    value={moduleForm.duration}
                                                    onChange={handleModuleChange}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-slate-500">Source</label>
                                            <div className="flex gap-2">
                                                <span onClick={() => setVideoInputType('url')} className={`cursor-pointer text-xs ${videoInputType === 'url' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Link</span>
                                                <span className="text-slate-300 text-xs">|</span>
                                                <span onClick={() => setVideoInputType('upload')} className={`cursor-pointer text-xs ${videoInputType === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Upload</span>
                                            </div>
                                        </div>

                                        {videoInputType === 'url' ? (
                                            <input
                                                name="url"
                                                placeholder={moduleForm.type === 'video' ? "https://youtube.com/..." : "https://example.com/file.pdf"}
                                                value={moduleForm.url}
                                                onChange={handleModuleChange}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                            />
                                        ) : (
                                            <div className="border border-dashed border-slate-300 rounded-md p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                                                <input
                                                    type="file"
                                                    accept={moduleForm.type === 'video' ? "video/*" : "application/pdf"}
                                                    onChange={(e) => handleFileUpload(e.target.files[0], 'url')}
                                                    disabled={uploading}
                                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                />
                                                <div className="text-xs text-slate-500">
                                                    {uploading ? `Uploading ${Math.round(uploadProgress)}%...` : (moduleForm.url ? 'File Uploaded' : 'Click to Upload Content')}
                                                </div>
                                                {uploading && (
                                                    <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Module Notes Section - Restored as requested */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Module Notes (Optional)</label>
                                        <div className="border border-dashed border-slate-300 rounded-md p-3 text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => handleFileUpload(e.target.files[0], 'notes')}
                                                disabled={uploading}
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                            />
                                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                <FileText className="text-slate-400" size={14} />
                                                {moduleForm.notes ? 'Notes Attached' : 'Upload PDF Notes'}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="w-full bg-primary-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm mt-4"
                                        onClick={addModule}
                                        disabled={!moduleForm.title || !moduleForm.url}
                                    >
                                        <Plus size={12} /> Add Module
                                    </button>
                                </div>

                                <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center">
                                    <button className="text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2" onClick={() => setStep(1)}>
                                        <ArrowLeft size={12} /> Back
                                    </button>
                                    <button className="bg-primary-900 hover:bg-slate-800 text-white font-semibold py-2 px-6 rounded-md text-sm flex items-center gap-2" onClick={() => setStep(3)}>
                                        Review <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Right: Module List */}
                            <div className="lg:col-span-2">
                                <div className="bg-[#f8fafc] h-full rounded-lg border border-slate-200 flex flex-col">
                                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-lg">
                                        <h3 className="text-sm font-bold text-primary-900">Curriculum ({courseData.modules.length})</h3>
                                    </div>

                                    <div className="flex-1 overflow-auto p-4 space-y-2">
                                        {courseData.modules.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                                <p>No modules added yet.</p>
                                            </div>
                                        ) : (
                                            courseData.modules.map((m, idx) => (
                                                <div key={m.id} className="bg-white p-3 rounded-md border border-slate-200 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                        <div>
                                                            <div className="font-semibold text-primary-900 text-sm">{m.title}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                <span className="uppercase font-bold text-[10px]">{m.type}</span>
                                                                {m.duration && <span>• {m.duration} mins</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => moveModule(idx, -1)} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><ArrowUp size={12} /></button>
                                                        <button onClick={() => moveModule(idx, 1)} disabled={idx === courseData.modules.length - 1} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><ArrowDown size={12} /></button>
                                                        <button onClick={() => removeModule(m.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Review */}
                    {step === 3 && (
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold text-primary-900">Final Verification</h3>
                                <p className="text-slate-500 text-sm">Review course details before publishing.</p>
                            </div>

                            <div className="bg-[#f8fafc] border border-slate-200 rounded-lg overflow-hidden">
                                <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Title</div>
                                        <div className="text-sm font-semibold text-primary-900">{courseData.title}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Category</div>
                                        <div className="text-sm font-semibold text-primary-900">{isCustomCategory ? courseData.customCategory : courseData.category}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Level</div>
                                        <div className="text-sm font-semibold text-primary-900">{courseData.level}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Content</div>
                                        <div className="text-sm font-semibold text-primary-900">{courseData.modules.length} Modules <span className="text-slate-400 font-normal">({courseData.modules.reduce((acc, m) => acc + Number(m.duration || 0), 0)} mins)</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                                    <button className="text-slate-600 font-bold text-sm flex items-center gap-2 hover:text-primary-900" onClick={() => setStep(2)}>
                                        <ArrowLeft size={12} /> Edit Content
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-md text-sm hover:bg-slate-50"
                                            onClick={() => handleSubmit('draft')}
                                        >
                                            Save Draft
                                        </button>
                                        <button
                                            className="px-6 py-2 bg-primary-900 hover:bg-slate-800 text-white font-bold rounded-md text-sm shadow-sm flex items-center gap-2"
                                            onClick={() => handleSubmit('pending')}
                                        >
                                            <Check size={12} /> Submit Course
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
};

export default AddCourseView;
