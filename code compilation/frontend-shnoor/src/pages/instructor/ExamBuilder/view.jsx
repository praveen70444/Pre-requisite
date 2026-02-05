import React, { useState } from 'react';
import { Save, ArrowRight, ArrowLeft, Trash2, Plus, Code, List, AlertCircle, AlignLeft, Settings, CheckCircle, Clock } from 'lucide-react';
import Editor from '@monaco-editor/react';

const ExamBuilderView = ({
    step, setStep, loading,
    courses, formData,
    handleInputChange, addQuestion, updateQuestion, removeQuestion,
    handleSave, navigate
}) => {
    // Local state for IDE-like navigation in Step 2
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium animate-pulse">
            Processing exam data...
        </div>
    );

    // Helper to jump to a question
    const handleQuestionSelect = (index) => {
        setActiveQuestionIndex(index);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-primary-900">
            {/* --- Top Bar --- */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 h-16">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/instructor/exams')} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-primary-900 tracking-tight">{formData.title || 'Untitled Exam'}</h1>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            {formData.duration && <span className="flex items-center gap-1"><Clock size={14} /> {formData.duration} mins</span>}
                            <span>• {formData.questions.length} Questions</span>
                            <span>• {formData.questions.reduce((acc, q) => acc + (q.marks || 0), 0)} Total Marks</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-md text-xs hover:bg-slate-200 transition-colors"
                        onClick={() => handleSave()} // Save Draft logic conceptually
                    >
                        Save Draft
                    </button>
                    <button
                        className="px-6 py-2 bg-primary-900 hover:bg-slate-800 text-white font-bold rounded-md text-xs shadow-sm flex items-center gap-2 transition-colors"
                        onClick={handleSave}
                    >
                        <Save size={16} /> Publish Exam
                    </button>
                </div>
            </header>

            {/* --- Main Workspace --- */}
            <div className="flex-1 flex overflow-hidden">

                {/* --- Sidebar (Navigation) --- */}
                <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Navigation</div>
                        <button
                            onClick={() => setStep(1)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3 mb-1 transition-colors ${step === 1 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Settings size={16} className={step === 1 ? 'text-indigo-500' : 'text-slate-400'} />
                            Configuration
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${step === 2 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <List size={16} className={step === 2 ? 'text-indigo-500' : 'text-slate-400'} />
                            Questions
                        </button>
                    </div>

                    {step === 2 && (
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {formData.questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => handleQuestionSelect(idx)}
                                    className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-medium flex items-center justify-between group transition-colors border ${activeQuestionIndex === idx ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${activeQuestionIndex === idx ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <span className="truncate max-w-[100px]">{q.text || `Question ${idx + 1}`}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono ml-2">{q.type.substr(0, 3).toUpperCase()}</span>

                                    <div
                                        onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); if (activeQuestionIndex >= idx && activeQuestionIndex > 0) setActiveQuestionIndex(activeQuestionIndex - 1); }}
                                        className="hidden group-hover:block p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                        <Trash2 size={12} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Add New</div>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => { addQuestion('mcq'); setActiveQuestionIndex(formData.questions.length); }} className="flex flex-col items-center justify-center gap-1 p-2 bg-white border border-slate-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600">
                                    <List size={16} />
                                    <span className="text-[10px] font-bold">MCQ</span>
                                </button>
                                <button onClick={() => { addQuestion('descriptive'); setActiveQuestionIndex(formData.questions.length); }} className="flex flex-col items-center justify-center gap-1 p-2 bg-white border border-slate-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600">
                                    <AlignLeft size={16} />
                                    <span className="text-[10px] font-bold">Text</span>
                                </button>
                                <button onClick={() => { addQuestion('coding'); setActiveQuestionIndex(formData.questions.length); }} className="flex flex-col items-center justify-center gap-1 p-2 bg-white border border-slate-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600">
                                    <Code size={16} />
                                    <span className="text-[10px] font-bold">Code</span>
                                </button>
                            </div>
                        </div>
                    )}
                </aside>

                {/* --- Main Content Area --- */}
                <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 lg:p-8">

                    {/* STEP 1: CONFIGURATION */}
                    {step === 1 && (
                        <div className="w-full space-y-6">
                            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
                                <h2 className="text-xl font-bold text-primary-900 mb-6 flex items-center gap-2">
                                    <Settings className="text-slate-400" size={20} /> Exam Settings
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Exam Title</label>
                                            <input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Mid-Term Assessment"
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all font-semibold text-primary-900"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows={4}
                                                placeholder="Instructions for students..."
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none transition-all resize-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Linked Course</label>
                                            <select
                                                name="courseId"
                                                value={formData.courseId}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm cursor-pointer"
                                            >
                                                <option value="">-- Standalone Exam --</option>
                                                {courses.map(course => (
                                                    <option key={course.courses_id} value={course.courses_id}>{course.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration (m)</label>
                                                <input
                                                    type="number"
                                                    name="duration"
                                                    value={formData.duration}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pass %</label>
                                                <input
                                                    type="number"
                                                    name="passPercentage"
                                                    value={formData.passPercentage}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Max attempts per student</label>
                                                <input
                                                    type="number"
                                                    name="maxAttempts"
                                                    min={1}
                                                    value={formData.maxAttempts}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                    title="Number of times a student can attempt this exam"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Validity</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    name="validity_value"
                                                    value={formData.validity_value}
                                                    onChange={handleInputChange}
                                                    disabled={!!formData.courseId}
                                                    className={`w-20 px-3 py-2 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm ${formData.courseId ? 'bg-slate-100 text-slate-400' : 'bg-white'}`}
                                                />
                                                <select
                                                    name="validity_unit"
                                                    value={formData.validity_unit}
                                                    onChange={handleInputChange}
                                                    disabled={!!formData.courseId}
                                                    className={`flex-1 px-3 py-2 border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm ${formData.courseId ? 'bg-slate-100 text-slate-400' : 'bg-white'}`}
                                                >
                                                    <option value="Days">Days</option>
                                                    <option value="Weeks">Weeks</option>
                                                </select>
                                            </div>
                                            {formData.courseId && (
                                                <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-1">
                                                    <AlertCircle size={12} /> Syncs with Course
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-8 py-3 bg-primary-900 hover:bg-slate-800 text-white font-bold rounded-md shadow-sm flex items-center gap-2 text-sm"
                                >
                                    Proceed to Questions <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: EDITING QUESTION */}
                    {step === 2 && formData.questions.length > 0 && (
                        <div className="w-full h-full flex flex-col">
                            {(() => {
                                const q = formData.questions[activeQuestionIndex];
                                if (!q) return <div className="text-center text-slate-400 mt-20">Select a question to edit</div>;

                                return (
                                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
                                        {/* Editor Header */}
                                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg shrink-0">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs font-bold uppercase shadow-sm">
                                                    Q{activeQuestionIndex + 1}
                                                </span>
                                                <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">{q.type} Question</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase mr-2">Marks:</label>
                                                <input
                                                    type="number"
                                                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-sm font-bold text-center focus:border-indigo-500 outline-none"
                                                    value={q.marks}
                                                    onChange={(e) => updateQuestion(q.id, 'marks', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        {/* Editor Body */}
                                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                                            {/* Question Text */}
                                            <div className="mb-8">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Question Text</label>
                                                <textarea
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none font-medium text-slate-800 text-base resize-none shadow-sm"
                                                    rows={3}
                                                    placeholder="Type your question here..."
                                                    value={q.text}
                                                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                                />
                                            </div>

                                            {/* Type Specific Fields */}
                                            {q.type === 'mcq' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className="relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                                    {String.fromCharCode(65 + i)}
                                                                </div>
                                                                <input
                                                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...q.options];
                                                                        newOpts[i] = e.target.value;
                                                                        updateQuestion(q.id, 'options', newOpts);
                                                                    }}
                                                                    className={`w-full pl-12 pr-4 py-3 border rounded-md outline-none transition-all ${q.correctAnswer === opt && opt !== '' ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20' : 'bg-white border-slate-200 focus:border-indigo-500'
                                                                        }`}
                                                                />
                                                                {q.correctAnswer === opt && opt !== '' && (
                                                                    <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 inline-block">
                                                        <label className="text-xs font-bold text-indigo-700 uppercase tracking-wide block mb-2">Correct Answer</label>
                                                        <div className="flex gap-4">
                                                            {q.options.map((opt, i) => (
                                                                <label key={i} className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name={`correct-${q.id}`}
                                                                        checked={q.correctAnswer === opt && opt !== ''}
                                                                        onChange={() => updateQuestion(q.id, 'correctAnswer', opt)}
                                                                        className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                    />
                                                                    <span className="text-sm font-medium text-indigo-900">Option {String.fromCharCode(65 + i)}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {q.type === 'descriptive' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Model Answer / Key Points (Optional)</label>
                                                        <textarea
                                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 outline-none font-medium text-slate-700 text-sm resize-none shadow-sm"
                                                            rows={6}
                                                            placeholder="Enter key points or a model answer for evaluation reference..."
                                                            value={q.modelAnswer || ''}
                                                            onChange={(e) => updateQuestion(q.id, 'modelAnswer', e.target.value)}
                                                        />
                                                        <p className="text-[10px] text-slate-400 mt-1">This will be visible to instructors during grading.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {q.type === 'coding' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Problem Title</label>
                                                            <input
                                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-500 outline-none font-bold text-sm"
                                                                placeholder="e.g. Sum of Array"
                                                                value={q.title || ''}
                                                                onChange={(e) => updateQuestion(q.id, 'title', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Language</label>
                                                            <select
                                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md focus:border-indigo-500 outline-none text-sm"
                                                                value={q.language || 'javascript'}
                                                                onChange={(e) => updateQuestion(q.id, 'language', e.target.value)}
                                                            >
                                                                <option value="javascript">JavaScript</option>
                                                                <option value="python">Python</option>
                                                                <option value="java">Java</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="border border-slate-300 rounded-lg overflow-hidden h-64 shadow-inner">
                                                        <Editor
                                                            height="100%"
                                                            defaultLanguage={q.language || 'javascript'}
                                                            value={q.starterCode}
                                                            onChange={(value) => updateQuestion(q.id, 'starterCode', value)}
                                                            theme="light"
                                                            options={{
                                                                minimap: { enabled: false },
                                                                fontSize: 14,
                                                                scrollBeyondLastLine: false,
                                                                lineNumbers: 'on',
                                                                glyphMargin: false,
                                                                folding: false,
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Test Cases */}
                                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Test Cases</label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100 hover:border-emerald-200 transition-all"
                                                                    onClick={() => {
                                                                        const newTestCase = { id: Date.now(), input: '', expected_output: '', is_hidden: false };
                                                                        updateQuestion(q.id, 'testCases', [...(q.testCases || []), newTestCase]);
                                                                    }}
                                                                >
                                                                    <CheckCircle size={10} /> Public
                                                                </button>
                                                                <button
                                                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-100 hover:border-amber-200 transition-all"
                                                                    onClick={() => {
                                                                        const newTestCase = { id: Date.now(), input: '', expected_output: '', is_hidden: true };
                                                                        updateQuestion(q.id, 'testCases', [...(q.testCases || []), newTestCase]);
                                                                    }}
                                                                >
                                                                    <Code size={10} /> Hidden
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(q.testCases || []).map((tc, tcIdx) => (
                                                                <div key={tc.id || tcIdx} className="flex gap-3 items-center">
                                                                    <div className="flex-1">
                                                                        <input
                                                                            placeholder="Input"
                                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:border-indigo-500 outline-none font-mono"
                                                                            value={tc.input}
                                                                            onChange={(e) => {
                                                                                const newTCs = [...q.testCases];
                                                                                newTCs[tcIdx].input = e.target.value;
                                                                                updateQuestion(q.id, 'testCases', newTCs);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <input
                                                                            placeholder="Expected Output"
                                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:border-indigo-500 outline-none font-mono"
                                                                            value={tc.expected_output}
                                                                            onChange={(e) => {
                                                                                const newTCs = [...q.testCases];
                                                                                newTCs[tcIdx].expected_output = e.target.value;
                                                                                updateQuestion(q.id, 'testCases', newTCs);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${tc.is_hidden ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                                                                        onClick={() => {
                                                                            const newTCs = [...q.testCases];
                                                                            newTCs[tcIdx].is_hidden = !newTCs[tcIdx].is_hidden;
                                                                            updateQuestion(q.id, 'testCases', newTCs);
                                                                        }}
                                                                        title={tc.is_hidden ? "Click to make Public" : "Click to make Hidden"}
                                                                    >
                                                                        {tc.is_hidden ? <><Code size={10} /> Hidden</> : <><CheckCircle size={10} /> Public</>}
                                                                    </button>
                                                                    <button
                                                                        className="text-slate-400 hover:text-rose-500 p-1"
                                                                        onClick={() => {
                                                                            const newTCs = q.testCases.filter((_, i) => i !== tcIdx);
                                                                            updateQuestion(q.id, 'testCases', newTCs);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {step === 2 && formData.questions.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                <List size={32} className="opacity-20" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600 mb-2">No Questions Defined</h3>
                            <p className="text-sm max-w-xs text-center mb-6">Start building your exam by adding questions from the sidebar.</p>
                            <div className="flex gap-3">
                                <button onClick={() => { addQuestion('mcq'); setActiveQuestionIndex(0); }} className="px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-bold text-indigo-600 hover:border-indigo-500">
                                    + MCQ
                                </button>
                                <button onClick={() => { addQuestion('coding'); setActiveQuestionIndex(0); }} className="px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-bold text-indigo-600 hover:border-indigo-500">
                                    + Coding
                                </button>
                                <button onClick={() => { addQuestion('descriptive'); setActiveQuestionIndex(0); }} className="px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-bold text-indigo-600 hover:border-indigo-500">
                                    + Text
                                </button>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default ExamBuilderView;
