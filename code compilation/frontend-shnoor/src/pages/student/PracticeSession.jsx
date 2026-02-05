import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../auth/firebase';
import api from '../../api/axios';
import ProblemDescription from '../../components/exam/ProblemDescription';
import CodeEditorPanel from '../../components/exam/CodeEditorPanel';


const PracticeSession = ({ question: propQuestion, value, onChange, onComplete, examId, questionId, onSubmitCode }) => {
    const { challengeId } = useParams();
    const navigate = useNavigate();

    const isEmbedded = !!propQuestion;

    const [fetchedQuestion, setFetchedQuestion] = useState(null);
    const [loading, setLoading] = useState(!isEmbedded);
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [evaluationResult, setEvaluationResult] = useState(null);
    const [questionCollapsed, setQuestionCollapsed] = useState(false);
    const [leftWidth, setLeftWidth] = useState(320);
    const isDraggingLeft = useRef(false);

    const question = isEmbedded ? propQuestion : fetchedQuestion;

    const languageTemplates = {
        'javascript': '// Write your JavaScript code here\n',
        'python': '# Write your Python code here\n',
        'java': '// Write your Java code here\npublic class Solution {\n    // methods\n}',
        'cpp': '// Write your C++ code here\n',
        'go': '// Write your Go code here\n'
    };

    useEffect(() => {
        if (isEmbedded) {
            const codes = value?.codes ?? (value?.code != null && value?.language ? { [value.language]: value.code } : {});
            const storedLanguage = value?.language ?? (propQuestion.language || 'javascript');
            const savedForLang = codes[storedLanguage];
            let initialCode;
            if (savedForLang !== undefined && savedForLang !== '') {
                initialCode = savedForLang;
            } else if (storedLanguage === 'javascript' && (propQuestion.starterCode || propQuestion.starter_code)) {
                initialCode = propQuestion.starterCode || propQuestion.starter_code;
            } else {
                initialCode = languageTemplates[storedLanguage] || languageTemplates['javascript'];
            }
            setCode(initialCode);
            setSelectedLanguage(storedLanguage);
            setLoading(false);
            if (onChange && (value === undefined || value === '')) {
                onChange({ codes: { [storedLanguage]: initialCode }, language: storedLanguage });
            }
        } else {
            const fetchQuestion = () => {
                const data = getStudentData();
                const found = data.practiceChallenges?.find(c => c.id === challengeId);
                if (found) {
                    setFetchedQuestion(found);
                    let initialCode = found.starterCode;
                    if (!initialCode) {
                        initialCode = languageTemplates['javascript'];
                    }
                    setCode(initialCode);
                }
                setLoading(false);
            };
            fetchQuestion();
        }
    }, [challengeId, propQuestion, isEmbedded, value]);

    useEffect(() => {
        const onMove = (e) => {
            if (!isDraggingLeft.current) return;
            const x = e.clientX ?? e.touches?.[0]?.clientX;
            if (x == null) return;
            const min = 200;
            const max = typeof window !== 'undefined' ? window.innerWidth * 0.6 : 600;
            setLeftWidth((w) => Math.min(max, Math.max(min, x)));
        };
        const onUp = () => { isDraggingLeft.current = false; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
    }, []);

    const handleLanguageChange = (lang) => {
        const prevCodes = value?.codes ?? {};
        const codeForNewLang = prevCodes[lang] ?? (lang === 'javascript' && question?.starterCode ? question.starterCode : (languageTemplates[lang] || languageTemplates['javascript']));
        setCode(codeForNewLang);
        setSelectedLanguage(lang);
        if (isEmbedded && onChange) {
            onChange({ codes: { ...prevCodes, [selectedLanguage]: code, [lang]: codeForNewLang }, language: lang });
        }
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        if (isEmbedded && onChange) {
            const prevCodes = value?.codes ?? {};
            onChange({ codes: { ...prevCodes, [selectedLanguage]: newCode }, language: selectedLanguage });
        }
    };

    const handleRun = async () => {
        if (!isEmbedded) {
            // For practice sessions, use external API
            handleRunPractice();
            return;
        }

        // For exam coding questions, use backend API to run against public test cases
        setIsRunning(true);
        setConsoleOutput([]);
        setEvaluationResult(null);

        try {
            const token = await auth.currentUser?.getIdToken(true);
            if (!token) {
                setConsoleOutput([{ type: 'error', msg: 'Authentication required' }]);
                setIsRunning(false);
                return;
            }

            // Get public test cases only for running
            const publicTestCases = (question.testCases || question.testcases || []).filter(tc => !tc.is_hidden && tc.isPublic !== false);
            
            if (publicTestCases.length === 0) {
                setConsoleOutput([{ type: 'info', msg: 'No public test cases available to run.' }]);
                setIsRunning(false);
                return;
            }

            const results = [];

            // Run code against each public test case
            for (let i = 0; i < publicTestCases.length; i++) {
                const tc = publicTestCases[i];
                try {
                    // Execute code against this test case
                    const response = await api.post(
                        '/api/public/test-code',
                        {
                            code: code,
                            language: selectedLanguage || question.language || 'python',
                            input: tc.input || '',
                            expectedOutput: tc.expected_output || tc.output || ''
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const result = response.data.execution;
                    const comparison = response.data.comparison;

                    if (result.error) {
                        results.push({ 
                            type: 'error', 
                            msg: `Test Case ${i + 1} - Runtime Error`,
                            input: tc.input,
                            expected: tc.expected_output || tc.output,
                            actual: result.error
                        });
                    } else {
                        if (comparison.passed) {
                            results.push({ 
                                type: 'success', 
                                msg: `Test Case ${i + 1} Passed!`,
                                input: tc.input,
                                expected: comparison.expectedOutput,
                                actual: comparison.actualOutput
                            });
                        } else {
                            results.push({ 
                                type: 'error', 
                                msg: `Test Case ${i + 1} Failed`,
                                input: tc.input,
                                expected: comparison.expectedOutput,
                                actual: comparison.actualOutput
                            });
                        }
                    }
                } catch (error) {
                    results.push({ 
                        type: 'error', 
                        msg: `Test Case ${i + 1} - Execution Error: ${error.response?.data?.message || error.message}`,
                        input: tc.input,
                        expected: tc.expected_output || tc.output,
                        actual: 'Error occurred'
                    });
                }
            }

            // Add summary
            const passedCount = results.filter(r => r.type === 'success').length;
            if (passedCount === publicTestCases.length && results.length > 0) {
                results.push({ 
                    type: 'success', 
                    msg: `All ${publicTestCases.length} Public Test Cases Passed!` 
                });
            }

            setConsoleOutput(results);
        } catch (error) {
            console.error('Run code error:', error);
            setConsoleOutput([{ 
                type: 'error', 
                msg: `Execution Error: ${error.response?.data?.message || error.message}` 
            }]);
        } finally {
            setIsRunning(false);
        }
    };

    const handleRunPractice = async () => {
        setIsRunning(true);
        setConsoleOutput([]);

        const languageMap = {
            'javascript': { language: 'javascript', version: '18.15.0' },
            'python': { language: 'python', version: '3.10.0' },
            'java': { language: 'java', version: '15.0.2' },
            'cpp': { language: 'c++', version: '10.2.0' },
            'go': { language: 'go', version: '1.16.2' }
        };

        const selectedLangConfig = languageMap[selectedLanguage];
        const testCases = (question.testCases || []).filter(tc => tc.isPublic);
        let results = [];
        let allPassed = true;

        if (testCases.length === 0) {
            results.push({ type: 'info', msg: 'No public test cases to run.' });
            setConsoleOutput(results);
            setIsRunning(false);
            return;
        }

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            let runnableCode = code;

            try {
                if (selectedLanguage === 'javascript') {
                    const match = code.match(/function\s+(\w+)\s*\(/);
                    if (match && match[1]) {
                        const funcName = match[1];
                        runnableCode = `
                            ${code}
                            try {
                                const args = [${tc.input}];
                                const result = ${funcName}(...args);
                                if (typeof result === 'object' && result !== null) {
                                    console.log(JSON.stringify(result));
                                } else {
                                    console.log(result);
                                }
                            } catch (err) {
                                console.error(err.message);
                            }
                        `;
                    }
                } else if (selectedLanguage === 'python') {
                    const match = code.match(/def\s+(\w+)\s*\(/);
                    if (match && match[1]) {
                        const funcName = match[1];
                        runnableCode = `
import sys
import json
${code}
if __name__ == "__main__":
    try:
        args = (${tc.input})
        if not isinstance(args, tuple):
            args = (args,)
        result = ${funcName}(*args)
        if isinstance(result, (list, dict, tuple)):
            print(json.dumps(result, separators=(',', ':')))
        elif isinstance(result, bool):
             print("true" if result else "false")
        else:
            print(result)
    except Exception as e:
        print(e, file=sys.stderr)
`;
                    }
                }

            } catch (err) {
                console.error("Wrapper preparation error", err);
            }

            try {
                const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                    language: selectedLangConfig.language,
                    version: selectedLangConfig.version,
                    files: [{ content: runnableCode }],
                    compile_timeout: 10000,
                    run_timeout: 3000,
                });

                const { run, compile } = response.data;

                if (compile && compile.stderr) {
                    allPassed = false;
                    results.push({ type: 'error', msg: `Compilation Error (Test Case ${i + 1}):\n${compile.stderr}` });
                    break;
                }

                if (run.stderr) {
                    allPassed = false;
                    results.push({ type: 'error', msg: `Runtime Error (Test Case ${i + 1}):\n${run.stderr}` });
                } else {
                    const actualOutput = (run.stdout || '').trim();
                    const expectedOutput = (tc.output || '').trim();

                    if (actualOutput === expectedOutput) {
                        results.push({ type: 'success', msg: `Test Case ${i + 1} Passed` });
                    } else {
                        allPassed = false;
                        results.push({ type: 'error', msg: `Test Case ${i + 1} Failed.\nInput: ${tc.input}\nExpected: ${expectedOutput}\nGot: ${actualOutput}` });
                    }
                }
            } catch (error) {
                allPassed = false;
                results.push({ type: 'error', msg: `Execution Error (Test Case ${i + 1}): ${error.message}` });
            }
        }

        if (allPassed && results.length > 0 && !results.some(r => r.type === 'error')) {
            results.push({ type: 'success', msg: 'All Public Test Cases Passed!' });
        }
        setConsoleOutput(results);
        setIsRunning(false);
    };

    const handleSubmit = async () => {
        if (!isEmbedded) {
            // For practice sessions, just call onComplete
            if (onComplete) onComplete();
            return;
        }

        // For exam coding questions, submit to backend for evaluation
        setIsSubmitting(true);
        setConsoleOutput([]);
        setEvaluationResult(null);

        try {
            const token = await auth.currentUser?.getIdToken(true);
            if (!token) {
                alert('Authentication required');
                setIsSubmitting(false);
                return;
            }

            // Submit code for evaluation
            // This will be handled by the exam submission, but we can also evaluate here
            // Save current code + language so parent stores it (do not reset language)
            if (onChange) {
                onChange({ code, language: selectedLanguage });
            }
            if (onComplete) {
                onComplete();
            }

            // Optionally: Evaluate immediately and show results
            // This would require the question_id and exam_id which we don't have here
            // So we'll let the exam submission handle the evaluation
            
            setIsSubmitting(false);
        } catch (error) {
            console.error('Submit error:', error);
            alert(`Submission failed: ${error.response?.data?.message || error.message}`);
            setIsSubmitting(false);
        }
    };

    /** Run code against ALL test cases (example + hidden) and show results. Does NOT submit exam. */
    const handleSubmitCode = async () => {
        if (!isEmbedded || !examId || !questionId) return;
        setIsRunning(true);
        setConsoleOutput([]);
        try {
            const token = await auth.currentUser?.getIdToken(true);
            if (!token) {
                setConsoleOutput([{ type: 'error', msg: 'Authentication required' }]);
                setIsRunning(false);
                return;
            }
            const res = await api.post(
                `/api/student/exams/${examId}/run-question/${questionId}`,
                { code, language: selectedLanguage || question?.language || 'python' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { testResults, summary } = res.data;
            const lines = [];
            testResults.forEach((t, i) => {
                if (t.isHidden) {
                    lines.push({
                        type: t.passed ? 'success' : 'error',
                        msg: `Test Case ${t.testCaseNumber} (Hidden): ${t.passed ? 'Passed' : 'Failed'}`,
                        hidden: true
                    });
                } else {
                    lines.push({
                        type: t.passed ? 'success' : 'error',
                        msg: `Test Case ${t.testCaseNumber}: ${t.passed ? 'Passed' : 'Failed'}`,
                        input: t.input,
                        expected: t.expectedOutput,
                        actual: t.error || t.actualOutput
                    });
                }
            });
            lines.push({
                type: summary.percentage === 100 ? 'success' : 'error',
                msg: `Total: ${summary.passedTestCases}/${summary.totalTestCases} passed (${summary.percentage}%)`
            });
            setConsoleOutput(lines);
        } catch (err) {
            console.error('Submit code error:', err);
            setConsoleOutput([{
                type: 'error',
                msg: err.response?.data?.message || err.message || 'Failed to run test cases'
            }]);
        } finally {
            setIsRunning(false);
        }
    };


    if (loading) return <div className="p-8 text-center text-slate-500">Loading challenge...</div>;
    if (!question) return <div className="p-8 text-center text-slate-500">Challenge not found.</div>;

    const content = (
        <div className="flex h-full overflow-hidden">
            {/* Question panel - resizable width, collapsible */}
            <div
                className="h-full border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 relative"
                style={{ width: questionCollapsed ? 0 : leftWidth, minWidth: questionCollapsed ? 0 : undefined, overflow: 'hidden' }}
            >
                <div className="h-full overflow-y-auto" style={{ width: questionCollapsed ? 0 : leftWidth }}>
                    <ProblemDescription question={question} />
                </div>
                {!questionCollapsed && (
                    <div
                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-300 active:bg-indigo-500 z-10"
                        onMouseDown={(e) => { e.preventDefault(); isDraggingLeft.current = true; }}
                        onTouchStart={() => { isDraggingLeft.current = true; }}
                        title="Drag to resize"
                    />
                )}
            </div>
            {questionCollapsed && (
                <button
                    type="button"
                    onClick={() => setQuestionCollapsed(false)}
                    className="shrink-0 w-8 h-full border-r border-slate-200 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 flex items-center justify-center text-xs font-bold"
                    title="Show question"
                >
                    ◀
                </button>
            )}
            <div className="flex-1 min-w-0 h-full relative flex flex-col">
                {!questionCollapsed && (
                    <button
                        type="button"
                        onClick={() => setQuestionCollapsed(true)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 border border-slate-200 bg-white rounded-r shadow text-slate-500 hover:text-indigo-600 hover:border-indigo-300 text-xs"
                        title="Hide question to get more code space"
                    >
                        ▶
                    </button>
                )}
                <CodeEditorPanel
                    question={question}
                    startCode={code}
                    language={selectedLanguage}
                    onLanguageChange={handleLanguageChange}
                    onCodeChange={handleCodeChange}
                    onRun={handleRun}
                    onSaveCode={isEmbedded ? handleSubmit : null}
                    onSubmitCode={isEmbedded && examId && questionId ? handleSubmitCode : null}
                    isRunning={isRunning || isSubmitting}
                    consoleOutput={consoleOutput}
                    isEmbedded={isEmbedded}
                />
            </div>
        </div>
    );

    if (isEmbedded) {
        return <div className="h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">{content}</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden m-6">
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <button onClick={() => navigate('/student/practice')} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2">
                    &larr; Back to Challenges
                </button>
            </div>
            <div className="flex-1 overflow-hidden">{content}</div>
        </div>
    );
};

export default PracticeSession;
