import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../../auth/firebase";
import api from "../../../api/axios";
import ExamBuilderView from "./view";

const ExamBuilder = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 60,
    passPercentage: 70,
    courseId: null,
    questions: [],
    validity_value: "",
    validity_unit: "Days",
    maxAttempts: 1,
  });

  /* =============================
     FETCH APPROVED COURSES
  ============================= */
  useEffect(() => {
    const fetchApprovedCourses = async () => {
      try {
        setLoadingCourses(true);
        const token = await auth.currentUser.getIdToken(true);

        const res = await api.get("/api/courses/instructor/approved", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch approved courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchApprovedCourses();
  }, []);

  /* =============================
     HANDLERS
  ============================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addQuestion = (type) => {
    const newQ =
      type === "mcq"
        ? {
            id: Date.now(),
            type: "mcq",
            text: "",
            options: ["", "", "", ""],
            correctAnswer: "",
            marks: 5,
          }
        : type === "descriptive"
          ? { id: Date.now(), type: "descriptive", text: "", marks: 10 }
          : {
              id: Date.now(),
              type: "coding",
              title: "",
              text: "",
              language: "javascript",
              starterCode: "// Write your code here",
              testCases: [],
              marks: 20,
            };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  const updateQuestion = (qId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId ? { ...q, [field]: value } : q,
      ),
    }));
  };

  const removeQuestion = (qId) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
  };

  const validateForm = () => {
    if (!formData.title) return "Exam title is required.";

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.text) return `Question ${i + 1} is missing text.`;
      if (q.type === "mcq") {
        if (q.options.some((o) => !o))
          return `Question ${i + 1} has empty options.`;
        if (!q.correctAnswer)
          return `Question ${i + 1} needs a correct answer.`;
      }
      if (q.type === "coding" && (!q.testCases || q.testCases.length === 0)) {
        return `Coding question ${i + 1} must have at least one test case.`;
      }
    }
    return null;
  };

  /* =============================
     SAVE EXAM
  ============================= */
  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);

      // 1️⃣ Create exam
      const examRes = await api.post(
        "/api/exams",
        {
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          passPercentage: formData.passPercentage,
          courseId: formData.courseId || null,
          validity_value: formData.courseId ? null : formData.validity_value,
          validity_unit: formData.courseId ? null : formData.validity_unit,
          maxAttempts: formData.maxAttempts != null ? Math.max(1, parseInt(formData.maxAttempts, 10) || 1) : 1,
          questions: formData.questions,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const examId = examRes.data.exam_id;

      // 2️⃣ Create questions
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        const order = i + 1;

        if (q.type === "mcq") {
          await api.post(`/api/exams/${examId}/questions/mcq`, {
            questionText: q.text,
            options: q.options,
            correctOption: q.correctAnswer,
            marks: q.marks,
            order,
          });
        }

        if (q.type === "descriptive") {
          await api.post(`/api/exams/${examId}/questions/descriptive`, {
            questionText: q.text,
            marks: q.marks,
            order,
          });
        }

        if (q.type === "coding") {
          const normalizedTestcases = q.testCases.map((tc) => ({
            input: String(tc.input ?? ""),
            expected_output: String(tc.expected_output ?? tc.output ?? ""),
            is_hidden: tc.is_hidden === true || tc.isHidden === true,
          }));

          await api.post(`/api/exams/${examId}/questions/coding`, {
            title: q.title,
            description: q.text,
            language: q.language,
            starter_code: q.starterCode,
            marks: q.marks,
            order,
            testcases: normalizedTestcases,
          });
        }
      }

      alert("Exam created successfully!");
      navigate("/instructor/exams");
    } catch (err) {
      console.error("Create exam error:", err);
      alert("Failed to save exam or questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExamBuilderView
      step={step}
      setStep={setStep}
      loading={loading}
      courses={courses}
      loadingCourses={loadingCourses}
      formData={formData}
      handleInputChange={handleInputChange}
      addQuestion={addQuestion}
      updateQuestion={updateQuestion}
      removeQuestion={removeQuestion}
      handleSave={handleSave}
      navigate={navigate}
    />
  );
};

export default ExamBuilder;
