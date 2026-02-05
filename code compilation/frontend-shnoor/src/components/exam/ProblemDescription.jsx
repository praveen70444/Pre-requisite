import React from 'react';

const ProblemDescription = ({ question }) => {
    if (!question) return <div className="p-4 text-slate-400">Select a question...</div>;

    const difficultyColors = {
        easy: 'bg-emerald-100 text-emerald-700',
        medium: 'bg-amber-100 text-amber-700',
        hard: 'bg-red-100 text-red-700'
    };

    const difficultyClass = difficultyColors[(question.difficulty || 'Medium').toLowerCase()] || difficultyColors.medium;

    return (
        <div className="h-full overflow-y-auto p-6 bg-slate-50 text-slate-700">
            <div className="mb-6 pb-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-3">{question.title}</h2>
                <div className="flex gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-transparent ${difficultyClass}`}>
                        {question.difficulty || 'Medium'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 border border-blue-200">
                        {question.marks || 10} Points
                    </span>
                </div>
            </div>

            <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{question.text}</div>
            </div>

            {question.inputFormat && (
                <div className="mb-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Input Format</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{question.inputFormat}</div>
                </div>
            )}

            {question.constraints && (
                <div className="mb-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Constraints</div>
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 font-mono text-xs">{question.constraints}</div>
                </div>
            )}

            <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Examples</div>
                {(question.testCases || []).filter(tc => tc.isPublic).slice(0, 2).map((tc, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 mb-3 shadow-sm">
                        <div className="mb-3">
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase mr-2">Input</span>
                            <div className="mt-1 p-2 bg-slate-800 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">{tc.input}</div>
                        </div>
                        <div>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase mr-2">Output</span>
                            <div className="mt-1 p-2 bg-slate-800 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">{tc.output}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProblemDescription;
