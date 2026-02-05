import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../auth/firebase";
import api from "../../../api/axios";
import MyExamsView from "./view";

const MyExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [viewContentExamId, setViewContentExamId] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const token = await auth.currentUser?.getIdToken(true);
        const res = await api.get("/api/exams/instructor", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExams(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch exams", err);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    if (auth.currentUser) fetchExams();
  }, []);

  const fetchResults = async (examId) => {
    if (!examId) return;
    setResultsLoading(true);
    setSelectedExamId(examId);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      const res = await api.get(`/api/exams/${examId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (err) {
      console.error("Failed to fetch results", err);
      setResults({ exam: {}, students: [] });
    } finally {
      setResultsLoading(false);
    }
  };

  const clearResults = () => {
    setSelectedExamId(null);
    setResults(null);
  };

  const fetchExamDetails = async (examId) => {
    if (!examId) return;
    setDetailsLoading(true);
    setViewContentExamId(examId);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      const res = await api.get(`/api/exams/${examId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExamDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch exam details", err);
      setExamDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeExamDetails = () => {
    setViewContentExamId(null);
    setExamDetails(null);
  };

  const handleDeleteExam = async (examId, examTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${examTitle || "this exam"}"? This cannot be undone.`)) return;
    try {
      const token = await auth.currentUser?.getIdToken(true);
      await api.delete(`/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExams((prev) => prev.filter((e) => e.exam_id !== examId));
      if (selectedExamId === examId) clearResults();
      if (viewContentExamId === examId) closeExamDetails();
    } catch (err) {
      console.error("Failed to delete exam", err);
      alert(err.response?.data?.message || "Failed to delete exam. Please try again.");
    }
  };

  const handleCreateExam = () => {
    navigate("/instructor/exams/create");
  };

  return (
    <MyExamsView
      exams={exams}
      loading={loading}
      selectedExamId={selectedExamId}
      results={results}
      resultsLoading={resultsLoading}
      onViewResults={fetchResults}
      onCloseResults={clearResults}
      onCreateExam={handleCreateExam}
      onViewContent={fetchExamDetails}
      viewContentExamId={viewContentExamId}
      examDetails={examDetails}
      detailsLoading={detailsLoading}
      onCloseContent={closeExamDetails}
      onDeleteExam={handleDeleteExam}
    />
  );
};

export default MyExams;
