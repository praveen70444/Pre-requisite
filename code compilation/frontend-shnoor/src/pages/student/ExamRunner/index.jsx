import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../../../auth/firebase";
import ExamRunnerView from "./view.jsx";
import api from "../../../api/axios";
import { onAuthStateChanged } from "firebase/auth";


const ExamRunner = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading exam from backend

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const token = await user.getIdToken();

      const res = await api.get(
        `/api/student/exams/${examId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setExam(res.data);

      if (res.data.duration > 0) {
        setTimeLeft(res.data.duration * 60);
      }
    } catch (err) {
      console.error("Failed to load exam:", err);

      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 403) {
        if (data?.code === "MAX_ATTEMPTS_EXCEEDED") {
          const used = data?.attemptsUsed ?? "?";
          const max = data?.maxAttempts ?? "?";
          alert(`You have used all allowed attempts for this exam (${used} of ${max}). You cannot attempt this exam again.`);
        } else {
          alert(data?.message || "You are not enrolled in this exam.");
        }
        navigate("/student/exams");
      } else if (status === 404) {
        alert("Exam not found.");
        navigate("/student/exams");
      } else {
        alert(data?.message || "Unable to load exam.");
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, [examId, navigate]);

  /* =========================
     TIMER
  ========================= */
  useEffect(() => {
    if (!exam || isSubmitted || exam.duration === 0 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, exam]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* =========================
     ANSWER HANDLING
     (KEYED BY QUESTION_ID)
  ========================= */
  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  /* =========================
     SUBMIT EXAM (BACKEND)
  ========================= */
  const handleSubmit = async () => {
    try {
      if (isSubmitted || isSubmitting) return;
      
      // Confirmation dialog
      const confirmed = window.confirm(
        "Are you sure you want to submit the exam? You cannot change your answers after submission."
      );
      if (!confirmed) return;

      if (!exam) {
        alert("Exam not loaded. Please refresh the page.");
        return;
      }
      if (!auth.currentUser) {
        alert("Please log in again.");
        navigate("/login");
        return;
      }

      setIsSubmitting(true);
      const token = await auth.currentUser.getIdToken(true);

      // Format answers for backend
      // Backend expects: [{ question_id, code/answer_text/selected_option_id }]
      const formattedAnswers = exam.questions.map((q) => {
        const questionId = q.question_id || q.id;
        const answerValue = answers[questionId];

        if (q.type === 'coding') {
          const lang = typeof answerValue === 'object' && answerValue?.language ? answerValue.language : (q.language || 'javascript');
          const code = typeof answerValue === 'object' && answerValue?.codes?.[lang] !== undefined
            ? answerValue.codes[lang]
            : (typeof answerValue === 'object' && answerValue?.code !== undefined ? answerValue.code : (answerValue || ''));
          return {
            question_id: questionId,
            code: code || '',
            ...(lang && { language: lang })
          };
        } else if (q.type === 'descriptive') {
          return {
            question_id: questionId,
            answer_text: answerValue || ''
          };
        } else if (q.type === 'mcq') {
          // Handle both old format (string) and new format (object with option_id)
          let selectedOptionId = null;
          if (answerValue) {
            if (typeof answerValue === 'object' && answerValue.option_id) {
              selectedOptionId = answerValue.option_id;
            } else if (typeof answerValue === 'string') {
              // Find option_id from option_text
              const option = (q.options || []).find(opt => {
                const optText = typeof opt === 'string' ? opt : opt.option_text;
                return optText === answerValue;
              });
              if (option && typeof option === 'object' && option.option_id) {
                selectedOptionId = option.option_id;
              }
            }
          }
          return {
            question_id: questionId,
            selected_option_id: selectedOptionId
          };
        }
        return null;
      }).filter(Boolean);

      const res = await api.post(
        `/api/exams/${examId}/submit`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Exam submission failed:", err);
      const data = err.response?.data;
      const errorMsg = data?.error || data?.message || err.message || "Submission failed. Please try again.";
      const hint = data?.hint ? `\n\n${data.hint}` : "";
      alert(`Error: ${errorMsg}${hint}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ExamRunnerView
      loading={loading}
      exam={exam}
      currentQIndex={currentQIndex}
      setCurrentQIndex={setCurrentQIndex}
      answers={answers}
      handleAnswer={handleAnswer}
      timeLeft={timeLeft}
      isSubmitted={isSubmitted}
      result={result}
      handleSubmit={handleSubmit}
      formatTime={formatTime}
      navigate={navigate}
      isSubmitting={isSubmitting}
      examId={examId}
    />
  );
};

export default ExamRunner;
