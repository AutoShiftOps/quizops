-- QuizOps — Exam mode schema changes
-- Run this in the Supabase SQL editor (or via the CLI) against your project
-- BEFORE using exam mode with a signed-in account. Exam-mode Supabase saves
-- will fail with an "unknown column" error until this has been applied.

ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'practice',
  ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_questions JSONB DEFAULT '[]';
