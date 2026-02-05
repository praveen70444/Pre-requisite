import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentExamsView from "./view";
import api from "../../../api/axios";

const StudentExams = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get("/api/exams");
        setExams(res.data); // 👈 DIRECT rows
      } catch (err) {
        console.error("Failed to load exams", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <StudentExamsView
      loading={loading}
      exams={exams}
      navigate={navigate}
    />
  );
};

export default StudentExams;
