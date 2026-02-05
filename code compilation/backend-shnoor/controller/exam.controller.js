import pool from "../../db/postgres.js";

  // Exam creation by instructor
  export const createExam = async (req, res) => {
    try {
      const { title, description, duration, passPercentage, courseId, validity_value, validity_unit, maxAttempts } = req.body;
      const instructorId = req.user.id;

      if (!title || !duration || !passPercentage) {
        return res.status(400).json({ message: "Missing required fields" });
      }
          // Rules for validity based on courseId
    if (!courseId) {
      // Standalone exam
      if (!validity_value || !validity_unit) {
        return res.status(400).json({
          message: "Standalone exams must have validity",
        });
      }
    } else {
      // Course-linked exam
      if (validity_value || validity_unit) {
        return res.status(400).json({
          message: "Course-linked exams must not have validity",
        });
      }
    }

      const attempts = maxAttempts != null ? Math.max(1, parseInt(maxAttempts, 10) || 1) : 1;

      let rows;
      try {
        const result = await pool.query(
          `
          INSERT INTO exams
            (title, description, duration, pass_percentage, instructor_id, course_id, validity_value, validity_unit, max_attempts)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING exam_id, title, duration, pass_percentage, max_attempts
          `,
          [title, description, duration, passPercentage, instructorId, courseId || null, validity_value || null, validity_unit || null, attempts]
        );
        rows = result.rows;
      } catch (colErr) {
        if (colErr.message && colErr.message.includes("max_attempts")) {
          const result = await pool.query(
            `
            INSERT INTO exams
              (title, description, duration, pass_percentage, instructor_id, course_id, validity_value, validity_unit)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING exam_id, title, duration, pass_percentage
            `,
            [title, description, duration, passPercentage, instructorId, courseId || null, validity_value || null, validity_unit || null]
          );
          rows = result.rows;
          if (rows[0]) rows[0].max_attempts = 1;
        } else throw colErr;
      }

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("Create exam error:", err);
      res.status(500).json({ message: "Failed to create exam" });
    }
  };

  // Instructor fetches all their exams, to see what are the exams they have created
  export const getInstructorExams = async (req, res) => {
    try {
      const instructorId = req.user.id;

      let rows;
      try {
        const result = await pool.query(
          `SELECT exam_id, title, duration, pass_percentage, created_at, max_attempts FROM exams WHERE instructor_id = $1 ORDER BY created_at DESC`,
          [instructorId]
        );
        rows = result.rows;
      } catch (colErr) {
        if (colErr.message && colErr.message.includes("max_attempts")) {
          const result = await pool.query(
            `SELECT exam_id, title, duration, pass_percentage, created_at FROM exams WHERE instructor_id = $1 ORDER BY created_at DESC`,
            [instructorId]
          );
          rows = result.rows.map((r) => ({ ...r, max_attempts: 1 }));
        } else throw colErr;
      }

      res.json(rows);
    } catch (err) {
      console.error("Fetch instructor exams error:", err);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  };

  // Student fetches all available exams 
  export const getAllExamsForStudents = async (req, res) => {
    try {
      const studentId = req.user?.user_id ?? req.user?.id;
      if (!studentId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let rows;
      try {
        const result = await pool.query(
          `
          SELECT
            e.exam_id,
            e.title,
            e.duration,
            e.pass_percentage,
            COALESCE(NULLIF(e.max_attempts, NULL), 1)::int AS max_attempts,
            (SELECT COUNT(*)::int FROM exam_submissions es WHERE es.exam_id = e.exam_id AND es.student_id = $1) AS attempts_used
          FROM exams e
          ORDER BY e.created_at DESC
          `,
          [studentId]
        );
        rows = result.rows;
      } catch (qErr) {
        if (qErr.message && qErr.message.includes("max_attempts")) {
          const result = await pool.query(
            `
            SELECT
              e.exam_id,
              e.title,
              e.duration,
              e.pass_percentage,
              1 AS max_attempts,
              (SELECT COUNT(*)::int FROM exam_submissions es WHERE es.exam_id = e.exam_id AND es.student_id = $1) AS attempts_used
            FROM exams e
            ORDER BY e.created_at DESC
            `,
            [studentId]
          );
          rows = result.rows;
        } else throw qErr;
      }

      res.json(rows);
    } catch (err) {
      console.error("Fetch exams error:", err);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  };

  // View mode of exam for instructor (includes questions and options)
  export const getExamDetailsForInstructor = async (req, res) => {
    try {
      const instructorId = req.user?.user_id ?? req.user?.id;
      const { examId } = req.params;
      if (!instructorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const check = await pool.query(
        `SELECT exam_id, title, duration, pass_percentage, description FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
        [examId, instructorId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Exam not found or access denied" });
      }
      const exam = check.rows[0];
      const { rows: questions } = await pool.query(
        `
        SELECT
          q.question_id,
          q.question_text,
          q.question_type,
          q.marks,
          q.question_order,
          (
            SELECT json_agg(json_build_object('option_text', o.option_text, 'is_correct', o.is_correct))
            FROM exam_mcq_options o WHERE o.question_id = q.question_id
          ) AS options,
          ecq.title AS coding_title,
          ecq.description AS coding_description,
          ecq.language AS coding_language,
          ecq.starter_code,
          (
            SELECT json_agg(json_build_object('input', etc.input, 'expected_output', etc.expected_output, 'is_hidden', etc.is_hidden) ORDER BY etc.testcase_id)
            FROM exam_test_cases etc WHERE etc.coding_id = ecq.coding_id
          ) AS test_cases
        FROM exam_questions q
        LEFT JOIN exam_coding_questions ecq ON ecq.question_id = q.question_id AND q.question_type = 'coding'
        WHERE q.exam_id = $1
        ORDER BY q.question_order
        `,
        [examId]
      );
      res.json({
        ...exam,
        questions: questions || [],
      });
    } catch (err) {
      console.error("getExamDetailsForInstructor error:", err);
      res.status(500).json({ message: "Failed to fetch exam details" });
    }
  };

  // Delete an exam by instructor
  export const deleteExam = async (req, res) => {
    try {
      const instructorId = req.user?.user_id ?? req.user?.id;
      const { examId } = req.params;
      if (!instructorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const check = await pool.query(
        `SELECT exam_id FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
        [examId, instructorId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Exam not found or you do not have permission to delete it" });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM exam_answers WHERE exam_id = $1`, [examId]);
        await client.query(`DELETE FROM exam_results WHERE exam_id = $1`, [examId]);
        await client.query(`DELETE FROM exam_submissions WHERE exam_id = $1`, [examId]).catch(() => {});
        await client.query(
          `DELETE FROM exam_test_cases WHERE coding_id IN (
            SELECT coding_id FROM exam_coding_questions WHERE question_id IN (
              SELECT question_id FROM exam_questions WHERE exam_id = $1
            )
          )`,
          [examId]
        );
        await client.query(
          `DELETE FROM exam_mcq_options WHERE question_id IN (SELECT question_id FROM exam_questions WHERE exam_id = $1)`,
          [examId]
        );
        await client.query(
          `DELETE FROM exam_coding_questions WHERE question_id IN (SELECT question_id FROM exam_questions WHERE exam_id = $1)`,
          [examId]
        );
        await client.query(`DELETE FROM exam_questions WHERE exam_id = $1`, [examId]);
        await client.query(`DELETE FROM exams WHERE exam_id = $1`, [examId]);
        await client.query("COMMIT");
        res.status(200).json({ message: "Exam deleted successfully" });
      } catch (delErr) {
        await client.query("ROLLBACK");
        throw delErr;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("deleteExam error:", err);
      res.status(500).json({ message: "Failed to delete exam", error: err.message });
    }
  };
