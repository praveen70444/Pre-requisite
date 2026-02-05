import pool from "../../db/postgres.js";
import executionOrchestrator from "../../services/executionOrchestrator.service.js";

export const submitExam = async (req, res) => {
  const client = await pool.connect();

  try {
    const { examId } = req.params;
    const studentId = req.user?.user_id ?? req.user?.id;
    if (!studentId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No answers submitted" });
    }

    // Check max_attempts: count attempts from exam_submissions (or exam_results if no submissions table)
    const examExists = await client.query(
      `SELECT exam_id FROM exams WHERE exam_id = $1`,
      [examId]
    );
    if (examExists.rows.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }
    let maxAttempts = 1;
    try {
      const metaRes = await client.query(
        `SELECT max_attempts FROM exams WHERE exam_id = $1`,
        [examId]
      );
      if (metaRes.rows[0]?.max_attempts != null) {
        maxAttempts = parseInt(metaRes.rows[0].max_attempts, 10) || 1;
      }
    } catch (_) {
      // max_attempts column may not exist yet; default to 1
    }

    let attemptCount = 0;
    try {
      const countRes = await client.query(
        `SELECT COUNT(*) AS c FROM exam_submissions WHERE exam_id = $1 AND student_id = $2`,
        [examId, studentId]
      );
      attemptCount = parseInt(countRes.rows[0]?.c ?? 0, 10);
    } catch (_) {
      // exam_submissions table might not exist; count from exam_results as fallback
      const countRes = await client.query(
        `SELECT COUNT(*) AS c FROM exam_results WHERE exam_id = $1 AND student_id = $2`,
        [examId, studentId]
      );
      attemptCount = parseInt(countRes.rows[0]?.c ?? 0, 10);
    }
    if (attemptCount >= maxAttempts) {
      return res.status(403).json({
        message: "You have surpassed the exam attempts",
        maxAttempts,
        attemptsUsed: attemptCount,
        code: "MAX_ATTEMPTS_EXCEEDED"
      });
    }

    // Record this attempt immediately in its own transaction so it always commits (used for attempt count).
    try {
      await pool.query(
        `INSERT INTO exam_submissions (exam_id, student_id, answers, status, submitted_at) VALUES ($1, $2, $3, $4, NOW())`,
        [examId, studentId, JSON.stringify(answers), "SUBMITTED"]
      );
    } catch (insertErr) {
      console.error("exam_submissions insert error (attempt not recorded):", insertErr.message);
      const msg = insertErr.message || "";
      // Fallback: try minimal insert (exam_id, student_id only) for tables with different schema
      try {
        await pool.query(
          `INSERT INTO exam_submissions (exam_id, student_id) VALUES ($1, $2)`,
          [examId, studentId]
        );
      } catch (minErr) {
        console.error("exam_submissions minimal insert also failed:", minErr.message);
        const tableMissing = msg.includes("relation") && msg.includes("does not exist");
        if (tableMissing) {
          return res.status(500).json({
            message: "Server configuration error: exam submissions table missing. Contact admin.",
            hint: "Run db/create_exam_submissions.sql in your database."
          });
        }
        // Allow submission to proceed even if attempt log fails - exam will still be graded
        console.warn("Proceeding with submission without recording attempt.");
      }
    }

    // Get existing result (for best-attempt comparison)
    const existingResult = await client.query(
      `SELECT total_marks, obtained_marks, percentage, passed FROM exam_results WHERE exam_id = $1 AND student_id = $2`,
      [examId, studentId]
    );
    const existing = existingResult.rows[0] || null;

    await client.query("BEGIN");

    // Remove old answers so we can insert this attempt (best-attempt: we'll keep only if this score is higher)
    await client.query(
      `DELETE FROM exam_answers WHERE exam_id = $1 AND student_id = $2`,
      [examId, studentId]
    );

    let totalMarks = 0;
    let obtainedMarks = 0;
    const { rows: questions } = await client.query(
      `
      SELECT question_id, marks, question_type
      FROM exam_questions
      WHERE exam_id = $1
      `,
      [examId]
    );

    if (!questions || questions.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Exam has no questions" });
    }

    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q.question_id] = q;
      totalMarks += (q.marks || 0);
    });

    // Store coding answer IDs for auto-evaluation
    const codingAnswerIds = [];

    for (const ans of answers) {
      const question = questionMap[ans.question_id];
      if (!question) continue;

      let marksObtained = 0;

      if (question.question_type === "mcq") {
        const optionId = ans.selected_option_id ?? null;
        if (optionId) {
          const { rows } = await client.query(
            `
            SELECT is_correct
            FROM exam_mcq_options
            WHERE option_id = $1
            `,
            [optionId]
          );
          if (rows.length && rows[0].is_correct) {
            marksObtained = question.marks || 0;
            obtainedMarks += marksObtained;
          }
        }
        await client.query(
          `
          INSERT INTO exam_answers
            (exam_id, question_id, student_id, selected_option_id, marks_obtained)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            examId,
            ans.question_id,
            studentId,
            optionId,
            marksObtained,
          ]
        );
      }


      if (question.question_type === "descriptive") {
        await client.query(
          `
          INSERT INTO exam_answers
            (exam_id, question_id, student_id, answer_text, marks_obtained)
          VALUES ($1, $2, $3, $4, NULL)
          `,
          [examId, ans.question_id, studentId, ans.answer_text]
        );
      }

      if (question.question_type === "coding") {
        // Insert coding answer and get answer_id (use submitted code; language used at evaluation)
        const answerResult = await client.query(
          `
          INSERT INTO exam_answers
            (exam_id, question_id, student_id, code_submission, marks_obtained)
          VALUES ($1, $2, $3, $4, NULL)
          RETURNING answer_id
          `,
          [examId, ans.question_id, studentId, ans.code ?? '']
        );
        
        const answerId = answerResult.rows[0].answer_id;
        codingAnswerIds.push({
          answerId,
          questionId: ans.question_id,
          submittedLanguage: ans.language || null
        });
      }
    }

    // Auto-evaluate coding answers
    for (const { answerId, questionId, submittedLanguage } of codingAnswerIds) {
      try {
        // Get test cases for this question
        const testCasesQuery = await client.query(
          `
          SELECT 
            testcase_id,
            input,
            expected_output,
            is_hidden
          FROM exam_test_cases
          WHERE coding_id = (
            SELECT coding_id 
            FROM exam_coding_questions 
            WHERE question_id = $1
          )
          ORDER BY testcase_id
          `,
          [questionId]
        );

        if (testCasesQuery.rows.length > 0) {
          // Get the code submission and language
          const answerQuery = await client.query(
            `
            SELECT 
              ea.code_submission,
              ea.marks_obtained,
              eq.marks AS total_marks,
              ecq.language,
              ecq.coding_id
            FROM exam_answers ea
            JOIN exam_questions eq ON ea.question_id = eq.question_id
            JOIN exam_coding_questions ecq ON eq.question_id = ecq.question_id
            WHERE ea.answer_id = $1
            `,
            [answerId]
          );

          if (answerQuery.rows.length > 0) {
            const answer = answerQuery.rows[0];
            const languageToUse = submittedLanguage || answer.language || "javascript";
            const codeToEval = answer.code_submission ?? "";
            
            // Evaluate code against test cases
            const evaluationResult = await executionOrchestrator.evaluateWithTestCases(
              codeToEval,
              languageToUse,
              testCasesQuery.rows
            );

            // Calculate marks based on passed test cases
            const totalQuestionMarks = answer.total_marks;
            const passedPercentage = evaluationResult.summary.percentage;
            const marksObtained = Math.round((passedPercentage / 100) * totalQuestionMarks);
            
            // Update the answer with evaluation results (try full update first, fallback to marks only if columns missing)
            try {
              await client.query(
                `
                UPDATE exam_answers
                SET 
                  marks_obtained = $1,
                  evaluation_result = $2::jsonb,
                  evaluated_at = NOW(),
                  evaluated_by = 'system-auto',
                  test_cases_passed = $3,
                  test_cases_total = $4
                WHERE answer_id = $5
                `,
                [
                  marksObtained,
                  JSON.stringify(evaluationResult),
                  evaluationResult.summary.passedTestCases,
                  evaluationResult.summary.totalTestCases,
                  answerId
                ]
              );
            } catch (updateErr) {
              if (updateErr.message && (updateErr.message.includes("column") || updateErr.message.includes("does not exist"))) {
                await client.query(
                  `UPDATE exam_answers SET marks_obtained = $1 WHERE answer_id = $2`,
                  [marksObtained, answerId]
                );
              } else throw updateErr;
            }

            obtainedMarks += marksObtained;
            console.log(`Auto-evaluated coding answer ${answerId}: ${marksObtained}/${totalQuestionMarks} marks`);
          }
        }
      } catch (evalError) {
        console.error(`Failed to auto-evaluate coding answer ${answerId}:`, evalError);
        // Continue with other answers even if one fails
        // The answer is still saved, just not evaluated
      }
    }

    const percentage =
      totalMarks === 0 ? 0 : Math.round((obtainedMarks / totalMarks) * 100);

    const { rows: examRows } = await client.query(
      `
      SELECT pass_percentage
      FROM exams
      WHERE exam_id = $1
      `,
      [examId]
    );

    if (!examRows || examRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Exam not found" });
    }

    const passPercentage = examRows[0].pass_percentage ?? 0;
    const passed = percentage >= passPercentage;

    // Best attempt: keep only if this score is higher than existing
    const existingMarks = existing ? (existing.obtained_marks ?? 0) : -1;
    if (existing && obtainedMarks <= existingMarks) {
      await client.query("ROLLBACK");
      // Attempt already recorded above in its own transaction
      return res.status(200).json({
        message: "Your previous attempt had a higher or equal score; result unchanged.",
        totalMarks: existing.total_marks,
        obtainedMarks: existing.obtained_marks,
        percentage: existing.percentage,
        passed: existing.passed,
        unchanged: true
      });
    }

    // Update or insert exam results (this attempt is better)
    try {
      const updateResult = await client.query(
        `
        UPDATE exam_results
        SET total_marks = $1, obtained_marks = $2, percentage = $3, passed = $4, evaluated_at = NOW()
        WHERE exam_id = $5 AND student_id = $6
        `,
        [totalMarks, obtainedMarks, percentage, passed, examId, studentId]
      );
      if (updateResult.rowCount === 0) {
        await client.query(
          `
          INSERT INTO exam_results
            (exam_id, student_id, total_marks, obtained_marks, percentage, passed, evaluated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `,
          [examId, studentId, totalMarks, obtainedMarks, percentage, passed]
        );
      }
    } catch (resErr) {
      if (resErr.message && (resErr.message.includes("column") || resErr.message.includes("does not exist"))) {
        await client.query(
          `UPDATE exam_results SET total_marks = $1, obtained_marks = $2, percentage = $3 WHERE exam_id = $4 AND student_id = $5`,
          [totalMarks, obtainedMarks, percentage, examId, studentId]
        );
      } else throw resErr;
    }

    // Attempt already recorded at the start in its own transaction

    // Fetch evaluation results for coding answers
    const evaluationResults = [];
    for (const { answerId, questionId } of codingAnswerIds) {
      try {
        const evalResult = await client.query(
          `
          SELECT 
            ea.answer_id,
            ea.evaluation_result,
            ea.marks_obtained,
            ea.test_cases_passed,
            ea.test_cases_total,
            eq.marks as total_marks,
            ecq.title as question_title
          FROM exam_answers ea
          JOIN exam_questions eq ON ea.question_id = eq.question_id
          JOIN exam_coding_questions ecq ON eq.question_id = ecq.question_id
          WHERE ea.answer_id = $1
          `,
          [answerId]
        );

        if (evalResult.rows.length > 0) {
          const evalData = evalResult.rows[0];
          evaluationResults.push({
            questionId,
            answerId,
            questionTitle: evalData.question_title,
            marksObtained: evalData.marks_obtained,
            totalMarks: evalData.total_marks,
            testCasesPassed: evalData.test_cases_passed,
            testCasesTotal: evalData.test_cases_total,
            evaluationResult: typeof evalData.evaluation_result === 'string' 
              ? JSON.parse(evalData.evaluation_result) 
              : evalData.evaluation_result
          });
        }
      } catch (err) {
        console.error(`Failed to fetch evaluation result for answer ${answerId}:`, err);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Exam submitted successfully",
      totalMarks,
      obtainedMarks,
      percentage,
      passed,
      codingAnswersEvaluated: codingAnswerIds.length,
      evaluationResults: evaluationResults
    });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("Submit exam error:", err.message);
    console.error("Submit exam stack:", err.stack);
    const message = err.message || "Failed to submit exam";
    const isConstraint = message.includes("unique") || message.includes("constraint") || message.includes("violates");
    res.status(500).json({
      message: "Failed to submit exam",
      error: message,
      ...(isConstraint && { hint: "You may have already submitted this exam." })
    });
  } finally {
    client.release();
  }
};
