-- Fixes: published_quizzes.attempt_count never incrementing for real readers.
--
-- published_quizzes' UPDATE policy is `auth.uid() = publisher_id` (owner
-- only), but the attempt-count increment runs in the READER's context —
-- almost always a guest or a signed-in user who isn't the publisher. That
-- update was being silently filtered out by RLS (0 rows affected, no error
-- returned), so attempt_count has been wrong for every publisher.
--
-- Fix: a SECURITY DEFINER function runs as its owner (postgres), bypassing
-- RLS for this one narrow, safe operation — it can only ever increment
-- attempt_count by 1 for a given quiz id, nothing else.
--
-- IMPORTANT — this file is not applied automatically. Run this SQL manually
-- in the Supabase SQL Editor against the project database.

CREATE OR REPLACE FUNCTION
  increment_attempt_count(quiz_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_quizzes
  SET attempt_count = attempt_count + 1
  WHERE id = quiz_id;
END;
$$;

-- Grant execute to anon and authenticated so both guests and signed-in
-- readers can call this from the client.
GRANT EXECUTE ON FUNCTION
  increment_attempt_count(UUID)
  TO anon, authenticated;
