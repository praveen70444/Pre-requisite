
const STORAGE_KEY = 'shnoor_assessments';

const INITIAL_ASSESSMENTS = [
    {
        id: 1,
        title: 'Midterm Practice Exam',
        description: 'Comprehensive review of the first half of the semester.',
        type: 'Practice',
        duration: 60,
        totalMarks: 50,
        negativeMarking: 0.25,
        status: 'Active',
        startDate: '2026-01-15',
        endDate: '2026-01-20',
        questions: [
            { id: 101, type: 'mcq', text: 'What is 2+2?', options: ['3', '4', '5', '6'], answer: '4', marks: 5 },
            { id: 102, type: 'coding', title: 'Sum Array', text: 'Write a function that returns the sum of an array.', constraints: 'Time: 1s', marks: 20, starterCode: 'function solve(arr) { \n // your code \n}', testCases: [{ input: '[1,2]', output: '3' }] }
        ]
    },
    {
        id: 2,
        title: 'Weekly Quiz - Algebra',
        type: 'Exam',
        duration: 30,
        totalMarks: 20,
        status: 'Draft',
        startDate: '2026-01-07',
        endDate: '2026-01-08',
        questions: []
    }
];

export const getAssessments = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASSESSMENTS));
        return INITIAL_ASSESSMENTS;
    }
    return JSON.parse(stored);
};

export const saveAssessments = (assessments) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
    window.dispatchEvent(new Event('assessmentsUpdated'));
};

export const addAssessment = (assessment) => {
    const list = getAssessments();
    const newAssessment = { ...assessment, id: Date.now() };
    const updated = [...list, newAssessment];
    saveAssessments(updated);
    return updated;
};

export const updateAssessment = (id, updates) => {
    const list = getAssessments();
    const updated = list.map(item => item.id === id ? { ...item, ...updates } : item);
    saveAssessments(updated);
    return updated;
};

export const deleteAssessment = (id) => {
    const list = getAssessments();
    const updated = list.filter(item => item.id !== id);
    saveAssessments(updated);
    return updated;
};

export const getAssessmentById = (id) => {
    return getAssessments().find(a => a.id === parseInt(id));
};
