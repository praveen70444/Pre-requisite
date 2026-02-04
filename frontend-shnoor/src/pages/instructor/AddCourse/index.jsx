import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { auth } from "../../../auth/firebase";
import api from "../../../api/axios";
import AddCourseView from "./view";

export const AddCourse = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editCourseId = searchParams.get("edit");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    thumbnail: "",
    level: "",
    customCategory: "",
    status: "draft",
    modules: [],
    validity_value: "",
    validity_unit: "days",
    prereq_description: "",
    prereq_video_urls: [""], // Changed to array with one empty string
    prereq_pdf_url: "",
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    type: "video",
    url: "",
    duration: "",
    notes: "",
    pdfUrl: "",
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoInputType, setVideoInputType] = useState("url");
  const [pdfInputType, setPdfInputType] = useState("url");

  // Functions for handling multiple video URLs
  const addVideoUrl = () => {
    setCourseData(prev => ({
      ...prev,
      prereq_video_urls: [...prev.prereq_video_urls, ""]
    }));
  };

  const removeVideoUrl = (index) => {
    setCourseData(prev => ({
      ...prev,
      prereq_video_urls: prev.prereq_video_urls.filter((_, i) => i !== index)
    }));
  };

  const updateVideoUrl = (index, value) => {
    setCourseData(prev => ({
      ...prev,
      prereq_video_urls: prev.prereq_video_urls.map((url, i) => 
        i === index ? value : url
      )
    }));
  };

  /* =========================
     LOAD COURSE (EDIT MODE)
     ========================= */
  useEffect(() => {
    if (location.state?.courseData) {
      const data = location.state.courseData;
      setCourseData({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        thumbnail: data.thumbnail || "",
        level: data.level || "",
        status: data.status || "draft",
        modules: data.modules || [],
        customCategory: "",
      });
    }
  }, [editCourseId, location.state]);

  /* =========================
     HANDLERS
     ========================= */
  const handleCourseChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      if (value === "custom") {
        setIsCustomCategory(true);
        setCourseData((p) => ({ ...p, category: "" }));
      } else {
        setIsCustomCategory(false);
        setCourseData((p) => ({ ...p, category: value }));
      }
    } else {
      setCourseData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleModuleChange = (e) => {
    const { name, value } = e.target;
    setModuleForm((p) => ({ ...p, [name]: value }));
  };

  const addModule = () => {
    if (!moduleForm.title || !moduleForm.url) return;

    setCourseData((p) => ({
      ...p,
      modules: [
        ...p.modules,
        {
          id: Date.now().toString(),
          ...moduleForm,
          duration: moduleForm.type === "pdf" ? 0 : moduleForm.duration || 0,
        },
      ],
    }));

    setModuleForm({
      title: "",
      type: "video",
      url: "",
      duration: "",
      notes: "",
      pdfUrl: "",
    });
  };

  const removeModule = (id) => {
    setCourseData((p) => ({
      ...p,
      modules: p.modules.filter((m) => m.id !== id),
    }));
  };

  const moveModule = (index, direction) => {
    setCourseData((p) => {
      const mods = [...p.modules];
      const target = index + direction;
      if (target < 0 || target >= mods.length) return p;
      const [moved] = mods.splice(index, 1);
      mods.splice(target, 0, moved);
      return { ...p, modules: mods };
    });
  };

  const handleFileUpload = async (file, fieldName) => {
  if (!file) return;

  // OPTIONAL: size check
  if (file.size > 100 * 1024 * 1024) {
    alert("File too large (max 100MB)");
    return;
  }

  // TEMP: if you're not uploading yet, just simulate
  // (prevents crash and keeps flow working)
  setUploading(true);

  setTimeout(() => {
    const fakeUrl = URL.createObjectURL(file);
    setModuleForm((prev) => ({
      ...prev,
      [fieldName]: fakeUrl,
    }));
    setUploading(false);
    setUploadProgress(100);
  }, 800);
};


  /* =========================
     SUBMIT COURSE
     ========================= */
  const handleSubmit = async (statusOverride) => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();

      const finalCategory = isCustomCategory
        ? courseData.customCategory
        : courseData.category;

      const courseRes = await api.post(
        "/api/courses",
        {
          title: courseData.title,
          description: courseData.description,
          category: finalCategory,
          difficulty: courseData.level,
          status: statusOverride,
          validity_value: courseData.validity_value
            ? Number(courseData.validity_value)
            : null,
          validity_unit: courseData.validity_value
            ? courseData.validity_unit
            : null,
          prereq_description: courseData.prereq_description || null,
          prereq_video_urls: courseData.prereq_video_urls.filter(url => url.trim() !== ""), // Filter out empty URLs
          prereq_pdf_url: courseData.prereq_pdf_url || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const courseId = courseRes.data.course.courses_id;

      if (courseData.modules.length) {
        await api.post(
          "/api/modules",
          {
            courseId,
            modules: courseData.modules.map((m, i) => ({
              title: m.title,
              type: m.type,
              content_url: m.url,
              duration: m.duration || 0,
              order_index: i + 1,
            })),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      navigate("/instructor/dashboard");
    } catch (err) {
      console.error("Save course error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EXPOSE ONLY LOGIC
     ========================= */
  return (
    <AddCourseView
      step={step}
      setStep={setStep}
      loading={loading}
      courseData={courseData}
      moduleForm={moduleForm}
      isCustomCategory={isCustomCategory}
      uploadProgress={uploadProgress}
      uploading={uploading}
      videoInputType={videoInputType}
      pdfInputType={pdfInputType}
      setVideoInputType={setVideoInputType}
      setPdfInputType={setPdfInputType}
      handleCourseChange={handleCourseChange}
      handleModuleChange={handleModuleChange}
      handleFileUpload={handleFileUpload}
      addModule={addModule}
      removeModule={removeModule}
      moveModule={moveModule}
      handleSubmit={handleSubmit}
      addVideoUrl={addVideoUrl}
      removeVideoUrl={removeVideoUrl}
      updateVideoUrl={updateVideoUrl}
    />
  );
};

export default AddCourse;
