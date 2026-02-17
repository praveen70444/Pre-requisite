-- Create course_comments table
CREATE TABLE IF NOT EXISTS course_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(courses_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT comment_text_not_empty CHECK (LENGTH(TRIM(comment_text)) > 0)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_comments_course_id ON course_comments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_created_at ON course_comments(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_course_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_comments_updated_at
    BEFORE UPDATE ON course_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_comments_updated_at();

-----------------------------------------------------------------Voting part----------------------------------------------------------------------------------------------------------------------------------


-- Add parent_comment_id to course_comments for reply functionality
ALTER TABLE course_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES course_comments(comment_id) ON DELETE CASCADE;

-- Create index for parent_comment_id
CREATE INDEX IF NOT EXISTS idx_course_comments_parent_id ON course_comments(parent_comment_id);

-- Create comment_votes table
CREATE TABLE IF NOT EXISTS comment_votes (
    vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES course_comments(comment_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(comment_id, user_id) -- One vote per user per comment
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
