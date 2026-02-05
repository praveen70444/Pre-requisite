import express from "express";
import firebaseAuth from "../middlewares/firebaseAuth.js";
import attachUser from "../middlewares/attachUser.js";
import roleGuard from "../middlewares/roleGuard.js";
import { codeExecutionLimiter } from "../middlewares/rateLimiter.js";

import {
  getStudentExams,
  getExamForAttempt,
  submitExam,
  runQuestionCode
} from "../controllers/studentExam.controller.js";

const router = express.Router();

// 1️⃣ List exams for enrolled courses
router.get(
  "/",
  firebaseAuth,
  attachUser,
  roleGuard("student", "user"),
  getStudentExams
);

// 2️⃣ Load exam questions (WITHOUT answers)
router.get(
  "/:examId",
  firebaseAuth,
  attachUser,
  roleGuard("student", "user"),
  getExamForAttempt
);

// 2b Run code against all test cases (example + hidden) for a question — does NOT save
router.post(
  "/:examId/run-question/:questionId",
  firebaseAuth,
  attachUser,
  roleGuard("student", "user"),
  codeExecutionLimiter,
  runQuestionCode
);

// 3️⃣ Submit exam
router.post(
  "/:examId/submit",
  firebaseAuth,
  attachUser,
  roleGuard("student", "user"),
  submitExam
);

export default router;
