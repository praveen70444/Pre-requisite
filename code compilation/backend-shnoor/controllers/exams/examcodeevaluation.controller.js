import pool from "../../db/postgres.js";
import executionOrchestrator from "../../services/executionOrchestrator.service.js";

// Auto-evaluate a coding answer
export const autoEvaluateCodingAnswer = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { answerId } = req.params;
    const evaluatorId = req.user?.user_id || 'system-auto';
    
    console.log(`Auto-evaluating coding answer: ${answerId}`);
    
    // 1. Get student's code and question details
    const answerQuery = await client.query(
      `
      SELECT 
        ea.answer_id,
        ea.code_submission,
        ea.exam_id,
        ea.question_id,
        ea.student_id,
        eq.marks,
        ecq.language,
        ecq.coding_id,
        ecq.title AS question_title
      FROM exam_answers ea
      JOIN exam_questions eq ON ea.question_id = eq.question_id
      JOIN exam_coding_questions ecq ON eq.question_id = ecq.question_id
      WHERE ea.answer_id = $1
        AND eq.question_type = 'coding'
      FOR UPDATE
      `,
      [answerId]
    );
    
    if (answerQuery.rows.length === 0) {
      if (res.status) {
        return res.status(404).json({ 
          success: false, 
          message: "Coding answer not found" 
        });
      }
      throw new Error("Coding answer not found");
    }
    
    const answer = answerQuery.rows[0];
    
    // 2. Get test cases for this question
    const testCasesQuery = await client.query(
      `
      SELECT 
        testcase_id,
        input,
        expected_output,
        is_hidden
      FROM exam_test_cases
      WHERE coding_id = $1
      ORDER BY testcase_id
      `,
      [answer.coding_id]
    );
    
    if (testCasesQuery.rows.length === 0) {
      if (res.status) {
        return res.status(400).json({ 
          success: false, 
          message: "No test cases found for this question" 
        });
      }
      throw new Error("No test cases found for this question");
    }
    
    // 3. Execute code against all test cases
    const evaluationResult = await executionOrchestrator.evaluateWithTestCases(
      answer.code_submission,
      answer.language,
      testCasesQuery.rows
    );
    
    // 4. Calculate marks based on passed test cases
    const totalMarks = answer.marks;
    const passedPercentage = evaluationResult.summary.percentage;
    const marksObtained = Math.round((passedPercentage / 100) * totalMarks);
    
    // 5. Update the answer in database
    await client.query(
      `
      UPDATE exam_answers
      SET 
        marks_obtained = $1,
        evaluation_result = $2::jsonb,
        evaluated_at = NOW(),
        evaluated_by = $3,
        test_cases_passed = $4,
        test_cases_total = $5
      WHERE answer_id = $6
      `,
      [
        marksObtained,
        JSON.stringify(evaluationResult),
        evaluatorId,
        evaluationResult.summary.passedTestCases,
        evaluationResult.summary.totalTestCases,
        answerId
      ]
    );
    
    // 6. Update exam results for this student
    await updateExamResults(client, answer.exam_id, answer.student_id);
    
    console.log(`Auto-evaluation completed for answer ${answerId}`);
    console.log(`Marks: ${marksObtained}/${totalMarks}`);
    console.log(`Test Cases: ${evaluationResult.summary.passedTestCases}/${evaluationResult.summary.totalTestCases}`);
    
    // 7. Return response if this is an API call
    if (res.json) {
      return res.json({
        success: true,
        message: "Code auto-evaluated successfully",
        evaluation: evaluationResult,
        marks: {
          obtained: marksObtained,
          total: totalMarks,
          percentage: passedPercentage
        },
        metadata: {
          answerId,
          examId: answer.exam_id,
          studentId: answer.student_id,
          questionId: answer.question_id
        }
      });
    }
    
    return {
      success: true,
      evaluationResult,
      marksObtained,
      totalMarks
    };
    
  } catch (error) {
    console.error("Auto-evaluation error:", error);
    
    // Update with error
    try {
      await client.query(
        `
        UPDATE exam_answers
        SET 
          evaluation_result = $1::jsonb,
          evaluated_at = NOW(),
          evaluated_by = 'system-error'
        WHERE answer_id = $2
        `,
        [
          JSON.stringify({ 
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          }),
          req.params.answerId
        ]
      );
    } catch (dbError) {
      console.error("Failed to save error to database:", dbError);
    }
    
    if (res.status) {
      return res.status(500).json({ 
        success: false, 
        message: "Auto-evaluation failed",
        error: error.message 
      });
    }
    
    throw error;
  } finally {
    client.release();
  }
};


  // Get detailed evaluation results
 
export const getCodingEvaluationResult = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { answerId } = req.params;
    const studentId = req.user.user_id;
    const userRole = req.user.role;
    
    // Base query
    let query = `
      SELECT 
        ea.answer_id,
        ea.code_submission,
        ea.marks_obtained,
        ea.evaluation_result,
        ea.evaluated_at,
        ea.test_cases_passed,
        ea.test_cases_total,
        eq.marks AS total_marks,
        eq.question_text,
        ecq.language,
        ecq.title AS question_title,
        u.full_name AS student_name,
        e.exam_id,
        e.title AS exam_title
      FROM exam_answers ea
      JOIN exam_questions eq ON ea.question_id = eq.question_id
      JOIN exam_coding_questions ecq ON eq.question_id = ecq.question_id
      JOIN users u ON ea.student_id = u.user_id
      JOIN exams e ON ea.exam_id = e.exam_id
      WHERE ea.answer_id = $1
    `;
    
    const params = [answerId];
    
    // Add authorization check for students
    if (userRole === 'student') {
      query += ` AND ea.student_id = $2`;
      params.push(studentId);
    }
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Evaluation result not found or access denied" 
      });
    }
    
    const evaluationData = result.rows[0];
    
    // Parse evaluation_result JSON
    if (evaluationData.evaluation_result) {
      evaluationData.evaluation_result = typeof evaluationData.evaluation_result === 'string' 
        ? JSON.parse(evaluationData.evaluation_result)
        : evaluationData.evaluation_result;
    }
    
    // Calculate percentage if not in evaluation_result
    if (!evaluationData.evaluation_result?.summary?.percentage && 
        evaluationData.test_cases_total > 0) {
      const percentage = Math.round(
        (evaluationData.test_cases_passed / evaluationData.test_cases_total) * 100
      );
      if (!evaluationData.evaluation_result) evaluationData.evaluation_result = {};
      if (!evaluationData.evaluation_result.summary) evaluationData.evaluation_result.summary = {};
      evaluationData.evaluation_result.summary.percentage = percentage;
    }
    
    // Filter hidden test cases for students
    if (userRole === 'student' && evaluationData.evaluation_result?.testResults) {
      evaluationData.evaluation_result.testResults = evaluationData.evaluation_result.testResults.map(test => ({
        ...test,
        input: test.isHidden ? '[Hidden Test Case]' : test.input,
        expectedOutput: test.isHidden ? '[Hidden Test Case]' : test.expectedOutput
      }));
    }
    
    res.json({
      success: true,
      data: evaluationData,
      permissions: {
        canViewCode: userRole === 'instructor' || userRole === 'admin' || evaluationData.student_id === studentId,
        canViewHiddenTests: userRole === 'instructor' || userRole === 'admin'
      }
    });
    
  } catch (error) {
    console.error("Get evaluation result error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch evaluation result" 
    });
  } finally {
    client.release();
  }
};

/**
 * Bulk evaluate all coding answers for an exam
 */
export const bulkEvaluateExamCodingAnswers = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { examId } = req.params;
    const instructorId = req.user.user_id;
    
    // Verify exam ownership
    const examCheck = await client.query(
      `SELECT exam_id FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
      [examId, instructorId]
    );
    
    if (examCheck.rows.length === 0) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    // Get all unevaluated coding answers for this exam
    const answersQuery = await client.query(
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
    
    console.log(`📊 Bulk evaluating ${answerIds.length} coding answers for exam ${examId}`);
    
    let successful = 0;
    let failed = 0;
    const results = [];
    
    // Evaluate each answer
    for (const answerId of answerIds) {
      try {
        const mockReq = { params: { answerId }, user: { user_id: instructorId } };
        const mockRes = {
          json: (data) => {
            results.push({ answerId, success: true, data });
            successful++;
          },
          status: () => mockRes
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
  } finally {
    client.release();
  }
};

/**
 * Get all unevaluated coding answers for an exam
 */
export const getUnevaluatedCodingAnswers = async (req, res) => {
  try {
    const { examId } = req.params;
    const instructorId = req.user.user_id;
    
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
        ea.submitted_at,
        ea.code_submission
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
};

/**
 * Manual evaluation override (instructor can adjust marks)
 */
export const manualEvaluateCodingAnswer = async (req, res) => {
  const client = await pool.connect();
  
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
    
    // Get answer details
    const answerQuery = await client.query(
      `SELECT ea.answer_id 
        FROM exam_answers ea
        JOIN exam_questions eq ON ea.question_id = eq.question_id
        WHERE eq.question_type = 'coding'
        AND ea.evaluated_at IS NULL
      LIMIT 1`,
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
    const examCheck = await client.query(
      `SELECT exam_id FROM exams WHERE exam_id = $1 AND instructor_id = $2`,
      [answer.exam_id, instructorId]
    );
    
    if (examCheck.rows.length === 0) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    // Ensure marks don't exceed maximum
    const finalMarks = Math.min(marks, answer.max_marks);
    
    // Update answer with manual evaluation
    await client.query(
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
    
    // Update exam results
    await updateExamResults(client, answer.exam_id, answer.student_id);
    
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
  } finally {
    client.release();
  }
};

// updating exam results after evaluation
async function updateExamResults(client, examId, studentId) {
  try {
    // Calculate total & obtained marks for all questions in the exam
    const marksQuery = await client.query(
      `
      SELECT 
        SUM(eq.marks) AS total_marks,
        SUM(COALESCE(ea.marks_obtained, 0)) AS obtained_marks
      FROM exam_questions eq
      LEFT JOIN exam_answers ea ON eq.question_id = ea.question_id
        AND ea.student_id = $2
        AND ea.exam_id = $1
      WHERE eq.exam_id = $1
      `,
      [examId, studentId]
    );
    
    const totalMarks = Number(marksQuery.rows[0].total_marks) || 0;
    const obtainedMarks = Number(marksQuery.rows[0].obtained_marks) || 0;
    
    // Get pass percentage
    const examQuery = await client.query(
      `SELECT pass_percentage FROM exams WHERE exam_id = $1`,
      [examId]
    );
    
    const passPercentage = examQuery.rows[0]?.pass_percentage || 70;
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const passed = percentage >= passPercentage;
    
    // Update exam_results table
    await client.query(
      `
      INSERT INTO exam_results
        (exam_id, student_id, total_marks, obtained_marks, percentage, passed, evaluated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (exam_id, student_id)
      DO UPDATE SET
        obtained_marks = EXCLUDED.obtained_marks,
        percentage = EXCLUDED.percentage,
        passed = EXCLUDED.passed,
        evaluated_at = EXCLUDED.evaluated_at
      `,
      [examId, studentId, totalMarks, obtainedMarks, percentage, passed]
    );
    
    console.log(`Updated exam results for student ${studentId} in exam ${examId}`);
    console.log(`Marks: ${obtainedMarks}/${totalMarks} (${percentage.toFixed(2)}%)`);
    console.log(`Status: ${passed ? 'PASSED' : 'FAILED'}`);
    
  } catch (error) {
    console.error("Failed to update exam results:", error);
    throw error;
  }
}

export default {
  autoEvaluateCodingAnswer,
  getCodingEvaluationResult,
  bulkEvaluateExamCodingAnswers,
  getUnevaluatedCodingAnswers,
  manualEvaluateCodingAnswer
};