-- QuizOps — Exam mode schema changes
-- Run this in the Supabase SQL editor (or via the CLI) against your project
-- BEFORE using exam mode with a signed-in account. Exam-mode Supabase saves
-- will fail with an "unknown column" error until this has been applied.
--
-- IMPORTANT: After running this migration, any app code using
-- onConflict:'user_id,bank_slug' must be updated to
-- onConflict:'user_id,bank_slug,mode'
-- This was fixed in ce08ba1.

ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'practice',
  ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_questions JSONB DEFAULT '[]';

-- Step 2: Update UNIQUE constraint to include mode
-- (allows one row per user per bank per mode)
ALTER TABLE quiz_attempts
  DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_bank_slug_key;

ALTER TABLE quiz_attempts
  ADD CONSTRAINT quiz_attempts_user_id_bank_slug_mode_key
  UNIQUE (user_id, bank_slug, mode);