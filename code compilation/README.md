# Code Compilation & Exam System Files

This directory contains all the files related to the exam system functionality including coding questions, code compilation, execution, and evaluation.

## 📁 Directory Structure

### Backend Files (`backend-shnoor/`)

#### 🔧 Controllers
- `controllers/studentExam.controller.js` - Student exam taking functionality
- `controllers/codeExecution.controller.js` - General code execution API
- `controllers/exams/exam.controller.js` - Main exam management
- `controllers/exams/examcoding.controller.js` - Coding questions management
- `controllers/exams/examcodeevaluation.controller.js` - Code evaluation logic
- `controllers/exams/examQuestion.controller.js` - MCQ questions management
- `controllers/exams/examdescriptive.controller.js` - Descriptive questions
- `controllers/exams/examSubmission.controller.js` - Exam submission handling
- `controllers/exams/examevaluation.controller.js` - Exam evaluation logic
- `controllers/exams/examresult.controller.js` - Exam results management

#### 🛣️ Routes
- `routes/exam.routes.js` - Main exam API routes
- `routes/studentExam.routes.js` - Student exam taking routes
- `routes/examCodeEvaluation.routes.js` - Code evaluation routes
- `routes/codeExecution.routes.js` - General code execution routes

#### 🗄️ Database
- `db/create_exam_submissions.sql` - Exam submissions table schema
- `db/add_max_attempts.sql` - Exam attempts limit schema

#### ⚙️ Services
- `services/codeExecution.service.js` - Core code execution engine (Docker-based)
- `services/executionOrchestrator.service.js` - Redis queue management for code execution

### Frontend Files (`frontend-shnoor/`)

#### 📄 Student Pages
- `src/pages/student/ExamRunner/index.jsx` - Main exam taking logic
- `src/pages/student/ExamRunner/view.jsx` - Exam taking UI
- `src/pages/student/StudentExams/index.jsx` - Student exam list logic
- `src/pages/student/StudentExams/view.jsx` - Student exam list UI
- `src/pages/student/PracticeSession.jsx` - Practice coding session

#### 🏗️ Instructor Pages
- `src/pages/instructor/ExamBuilder/index.jsx` - Exam creation logic
- `src/pages/instructor/ExamBuilder/view.jsx` - Exam builder UI
- `src/pages/instructor/MyExams/index.jsx` - Instructor exam management logic
- `src/pages/instructor/MyExams/view.jsx` - Instructor exam management UI

#### 🧩 Components
- `src/components/exam/CodeEditorPanel.jsx` - Code editor component
- `src/components/exam/ProblemDescription.jsx` - Problem display component
- `src/components/exam/EvaluationResults.jsx` - Test results display component

#### 🔧 Utils & Assets
- `src/utils/assessmentStorage.js` - Exam data utilities
- `src/assets/exam.png` - Exam icon

## 🔑 Key Functionalities

### 🏃‍♂️ Code Execution & Testing
- **studentExam.controller.js** → `runQuestionCode()` - Run/compile code in exams
- **codeExecution.service.js** → `evaluateWithTestCases()` - Test code against test cases
- **executionOrchestrator.service.js** → Redis queue management for scalable execution
- **CodeEditorPanel.jsx** → Code editor interface with syntax highlighting

### 📝 Exam Taking
- **ExamRunner/index.jsx** → Main exam taking logic and state management
- **ExamRunner/view.jsx** → Exam taking UI with timer and navigation
- **PracticeSession.jsx** → Practice coding interface for students

### ✅ Submission & Evaluation
- **examSubmission.controller.js** → `submitExam()` - Handle exam completion
- **examcodeevaluation.controller.js** → Code evaluation and scoring logic
- **EvaluationResults.jsx** → Display test results and feedback

### 🏗️ Exam Creation
- **ExamBuilder/index.jsx** → Exam creation logic and validation
- **examcoding.controller.js** → Add and manage coding questions
- **examQuestion.controller.js** → Add and manage MCQ questions

### 📊 Results & Management
- **examresult.controller.js** → Exam results processing and storage
- **MyExams/** → Instructor exam management interface
- **StudentExams/** → Student exam list and history

## 🔧 Code Execution Flow

```
Frontend Code Editor
        ↓
    Submit Code
        ↓
Backend API Endpoint
        ↓
Execution Orchestrator
        ↓
Code Execution Service
        ↓
Docker Container
        ↓
Language Runtime (Python/JS/Java/C++)
        ↓
Execution Results
        ↓
Frontend Results Display
```

## 🚀 Supported Languages

- **Python** - Using Python 3.11 Alpine Docker image
- **JavaScript** - Using Node.js 18 Alpine Docker image
- **Java** - Using OpenJDK 17 Docker image
- **C++** - Using GCC latest Docker image

## 📋 Total Files: 25+

This collection represents the complete exam system from creation to evaluation, including all code compilation and execution functionality.