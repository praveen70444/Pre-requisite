import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../../../auth/firebase";
import api from "../../../api/axios";
import CourseDetailView from "./view";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Fetch course + enrollment status
  useEffect(() => {
    const fetchCourseAndStatus = async () => {
      try {
        if (!auth.currentUser) return;

        const token = await auth.currentUser.getIdToken(true);

        const [courseRes, statusRes] = await Promise.all([
          api.get(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/api/student/${courseId}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setCourse(courseRes.data);
        setIsEnrolled(statusRes.data.enrolled);
      } catch (err) {
        console.error("Error loading course:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndStatus();
  }, [courseId]);

  // Enroll handler
  const handleEnroll = async () => {
    try {
      const token = await auth.currentUser.getIdToken(true);

      await api.post(
        `/api/student/${courseId}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsEnrolled(true);
      alert("Successfully enrolled! 🚀");
    } catch (err) {
      console.error("Enroll failed:", err);
      alert("Failed to enroll");
    }
  };

  // Continue learning handler
  const handleContinue = () => {
    navigate(`/student/course/${courseId}/learn`);
  };

  return (
    <CourseDetailView
      course={course}
      loading={loading}
      isEnrolled={isEnrolled}
      navigate={navigate}
      handleEnroll={handleEnroll}
      handleContinue={handleContinue}
      courseId={courseId}
    />
  );
};

export default CourseDetail;