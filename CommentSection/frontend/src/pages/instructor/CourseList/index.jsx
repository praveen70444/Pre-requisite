{/*import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../auth/firebase";
import api from "../../../api/axios";
import CourseListView from './view';


export const CourseList = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!auth.currentUser) return;

        const token = await auth.currentUser.getIdToken();
        const res = await api.get("/api/courses/instructor", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);


  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      const token = await auth.currentUser.getIdToken();
      await api.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCourses((prev) =>
        prev.filter((c) => c.courses_id !== courseId)
      );

      if (selectedCourse?.courses_id === courseId) {
        setSelectedCourse(null);
      }
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to delete course");
    }
  };


  const openCourse = (course) => {
    setSelectedCourse(course);
  };

  const backToList = () => {
    setSelectedCourse(null);
  };

  const editCourse = (course) => {
    navigate(`/instructor/add-course?edit=${course.courses_id}`, {
      state: { courseData: course },
    });
  };

  return (
    <CourseListView
      loading={loading}
      courses={courses}
      navigate={navigate}
      handleDelete={deleteCourse}
      backToList={backToList}
      editCourse={editCourse}
      deleteCourse={deleteCourse}
    />
  );
};*/}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../auth/firebase";
import api from "../../../api/axios";
import CourseListView from "./view";

export const CourseList = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH COURSES
  ========================= */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!auth.currentUser) return;

        const token = await auth.currentUser.getIdToken();
        const res = await api.get("/api/courses/instructor", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  /* =========================
     COURSE ACTIONS
  ========================= */
  const openCourse = (course) => {
    setSelectedCourse(course);
  };

  const backToList = () => {
    setSelectedCourse(null);
  };

  const editCourse = (course) => {
    navigate(`/instructor/add-course?edit=${course.courses_id}`, {
      state: { courseData: course },
    });
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      const token = await auth.currentUser.getIdToken();
      await api.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCourses((prev) =>
        prev.filter((c) => c.courses_id !== courseId)
      );

      if (selectedCourse?.courses_id === courseId) {
        setSelectedCourse(null);
      }
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to delete course");
    }
  };

  return (
    <CourseListView
      loading={loading}
      courses={courses}
      selectedCourse={selectedCourse}
      onOpenCourse={openCourse}
      onBack={backToList}
      onEdit={editCourse}
      onDelete={deleteCourse}
      onCreate={() => navigate("/instructor/add-course")}
    />
  );
};
export default CourseList;
