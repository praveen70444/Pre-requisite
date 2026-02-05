import express from 'express';
import { 
  autoEvaluateCodingAnswer, 
  getCodingEvaluationResult
} from '../controllers/exams/examcodeevaluation.controller.js';
import roleGuard from '../middlewares/roleGuard.js';
import authenticateFirebase from '../middlewares/firebaseAuth.js';
import { codeExecutionLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// authentication
router.use(authenticateFirebase);

// Map firebase to user (for now)
router.use((req, res, next) => {
  if (req.firebase && !req.user) {
    req.user = {
      user_id: req.firebase.uid,
      email: req.firebase.email,
      role: 'instructor', 
      name: req.firebase.name
    };
  }
  next();
});

// INSTRUCTOR ENDPOINTS 

// Auto-evaluate single coding answer
router.post(
  '/evaluate/:answerId/auto',
  roleGuard(['instructor', 'admin']),
  autoEvaluateCodingAnswer
);

// SHARED ENDPOINTS 

// Get evaluation results
router.get(
  '/evaluate/:answerId/results',
  roleGuard(['instructor', 'admin', 'student']),
  getCodingEvaluationResult
);

// Get all unevaluated coding answers for an exam 
router.get(
  '/exam/:examId/unevaluated',
  roleGuard(['instructor', 'admin']),
  async (req, res) => {
    try {
      const { examId } = req.params;
      const instructorId = req.user.user_id;
      
      // Import pool
      const poolModule = await import('../db/postgres.js');
      const pool = poolModule.default;
      
      // Verify exam ownership
      const examCheck = await pool.query(
        `SELECT exam_id FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
        [examId, instructorId]
      );
      
      if (examCheck.rows.length === 0) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const { rows } = await pool.query(
        `
        SELECT 
          ea.answer_id,
          ea.student_id,
          u.full_name AS student_name,
          u.email,
          eq.question_text,
          ecq.language,
          ea.submitted_at
        FROM exam_answers ea
        JOIN exam_questions eq ON ea.question_id = eq.question_id
        JOIN exam_coding_questions ecq ON eq.question_id = ecq.question_id
        JOIN users u ON ea.student_id = u.user_id
        WHERE ea.exam_id = $1 
          AND eq.question_type = 'coding'
          AND ea.evaluated_at IS NULL
        ORDER BY ea.submitted_at
        `,
        [examId]
      );
      
      res.json({
        success: true,
        count: rows.length,
        answers: rows
      });
      
    } catch (error) {
      console.error("Get unevaluated answers error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch unevaluated answers" 
      });
    }
  }
);

// Bulk evaluate endpoint 
router.post(
  '/exam/:examId/bulk-evaluate',
  roleGuard(['instructor', 'admin']),
  codeExecutionLimiter,
  async (req, res) => {
    try {
      const { examId } = req.params;
      const instructorId = req.user.user_id;
      
      // Import pool
      const poolModule = await import('../db/postgres.js');
      const pool = poolModule.default;
      
      // Verify exam ownership
      const examCheck = await pool.query(
        `SELECT exam_id FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
        [examId, instructorId]
      );
      
      if (examCheck.rows.length === 0) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Get all unevaluated coding answers
      const answersQuery = await pool.query(
        `
        SELECT ea.answer_id
        FROM exam_answers ea
        JOIN exam_questions eq ON ea.question_id = eq.question_id
        WHERE ea.exam_id = $1 
          AND eq.question_type = 'coding'
          AND ea.evaluated_at IS NULL
        ORDER BY ea.submitted_at
        `,
        [examId]
      );
      
      const answerIds = answersQuery.rows.map(row => row.answer_id);
      
      if (answerIds.length === 0) {
        return res.json({
          success: true,
          message: "No unevaluated coding answers found",
          evaluated: 0,
          total: 0
        });
      }
      
      console.log(`Bulk evaluating ${answerIds.length} coding answers for exam ${examId}`);
      
      let successful = 0;
      let failed = 0;
      const results = [];
      
      // Evaluate each answer
      for (const answerId of answerIds) {
        try {
          // Create mock request for autoEvaluateCodingAnswer
          const mockReq = { 
            params: { answerId }, 
            user: { 
              user_id: instructorId,
              role: 'instructor'
            }
          };
          
          const mockRes = {
            json: (data) => {
              results.push({ answerId, success: true, data });
              successful++;
            },
            status: () => mockRes,
            send: () => {}
          };
          
          await autoEvaluateCodingAnswer(mockReq, mockRes);
          
        } catch (error) {
          console.error(`Failed to evaluate answer ${answerId}:`, error);
          results.push({ answerId, success: false, error: error.message });
          failed++;
        }
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      res.json({
        success: true,
        message: `Bulk evaluation completed`,
        summary: {
          total: answerIds.length,
          successful,
          failed,
          answers: results
        }
      });
      
    } catch (error) {
      console.error("Bulk evaluation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Bulk evaluation failed",
        error: error.message 
      });
    }
  }
);

// Manual evaluation endpoint
router.post(
  '/evaluate/:answerId/manual',
  roleGuard(['instructor', 'admin']),
  async (req, res) => {
    try {
      const { answerId } = req.params;
      const { marks, notes } = req.body;
      const instructorId = req.user.user_id;
      
      if (marks === undefined || marks < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid marks are required" 
        });
      }
      
      // Import pool
      const poolModule = await import('../db/postgres.js');
      const pool = poolModule.default;
      
      // Get answer details
      const answerQuery = await pool.query(
        `
        SELECT ea.answer_id, ea.exam_id, ea.student_id, ea.question_id, eq.marks AS max_marks
        FROM exam_answers ea
        JOIN exam_questions eq ON ea.question_id = eq.question_id
        WHERE ea.answer_id = $1
        `,
        [answerId]
      );
      
      if (answerQuery.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Answer not found" 
        });
      }
      
      const answer = answerQuery.rows[0];
      
      // Verify instructor owns the exam
      const examCheck = await pool.query(
        `SELECT exam_id FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
        [answer.exam_id, instructorId]
      );
      
      if (examCheck.rows.length === 0) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Ensure marks don't exceed maximum
      const finalMarks = Math.min(marks, answer.max_marks);
      
      // Update answer with manual evaluation
      await pool.query(
        `
        UPDATE exam_answers
        SET 
          marks_obtained = $1,
          evaluation_result = COALESCE(evaluation_result, '{}'::jsonb) || $2::jsonb,
          evaluated_at = NOW(),
          evaluated_by = $3
        WHERE answer_id = $4
        `,
        [
          finalMarks,
          JSON.stringify({ 
            manualEvaluation: true,
            instructorNotes: notes,
            manualMarks: finalMarks,
            evaluatedBy: instructorId,
            timestamp: new Date().toISOString()
          }),
          instructorId,
          answerId
        ]
      );
      
      res.json({
        success: true,
        message: "Manual evaluation completed",
        marks: {
          obtained: finalMarks,
          maximum: answer.max_marks
        }
      });
      
    } catch (error) {
      console.error("Manual evaluation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Manual evaluation failed",
        error: error.message 
      });
    }
  }
);

// Get exam statistics
router.get(
  '/exam/:examId/stats',
  roleGuard(['instructor', 'admin']),
  async (req, res) => {
    try {
      const { examId } = req.params;
      const instructorId = req.user.user_id;
      
      // Import pool
      const poolModule = await import('../db/postgres.js');
      const pool = poolModule.default;
      
      // Verify exam ownership
      const examCheck = await pool.query(
        `SELECT exam_id FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
        [examId, instructorId]
      );
      
      if (examCheck.rows.length === 0) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const stats = await pool.query(
        `
        SELECT 
          COUNT(*) as total_answers,
          COUNT(CASE WHEN evaluated_at IS NOT NULL THEN 1 END) as evaluated,
          COUNT(CASE WHEN evaluated_at IS NULL THEN 1 END) as pending,
          AVG(CASE WHEN marks_obtained > 0 THEN marks_obtained END) as avg_marks,
          MIN(marks_obtained) as min_marks,
          MAX(marks_obtained) as max_marks
        FROM exam_answers ea
        JOIN exam_questions eq ON ea.question_id = eq.question_id
        WHERE ea.exam_id = $1 AND eq.question_type = 'coding'
        `,
        [examId]
      );
      
      res.json({
        success: true,
        statistics: stats.rows[0]
      });
      
    } catch (error) {
      console.error("Get exam stats error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch statistics" 
      });
    }
  }
);

export default router;