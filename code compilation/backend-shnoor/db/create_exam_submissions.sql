
CREATE TABLE IF NOT EXISTS exam_submissions (
  exam_submission_id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  answers TEXT,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam_student
  ON exam_submissions (exam_id, student_id);

ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();
ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS answers TEXT;
ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SUBMITTED';



ALTER TABLE exams
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;


ALTER TABLE exam_answers 
ADD COLUMN IF NOT EXISTS evaluation_result JSONB,
ADD COLUMN IF NOT EXISTS evaluated_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS test_cases_passed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS test_cases_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS compilation_error TEXT;

CREATE INDEX IF NOT EXISTS idx_exam_answers_evaluated ON exam_answers(evaluated_at);
CREATE INDEX IF NOT EXISTS idx_exam_answers_exam_student ON exam_answers(exam_id, student_id);

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;

