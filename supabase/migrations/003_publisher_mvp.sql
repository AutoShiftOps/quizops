-- ============================================================
-- QuizOps — Migration 003: Publisher MVP
-- Run in Supabase SQL Editor → New query
-- Safe to re-run: IF NOT EXISTS + DROP POLICY IF EXISTS
-- ============================================================


-- ── 1. publishers ─────────────────────────────────────────────
-- One row per publisher. Created on first dashboard visit.

CREATE TABLE IF NOT EXISTS publishers (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  bio           TEXT,
  website_url   TEXT,
  tier          TEXT NOT NULL DEFAULT 'free'
                  CHECK (tier IN ('free', 'pro', 'team')),
  quiz_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publishers: read own"   ON publishers;
DROP POLICY IF EXISTS "publishers: insert own" ON publishers;
DROP POLICY IF EXISTS "publishers: update own" ON publishers;
DROP POLICY IF EXISTS "publishers: public read" ON publishers;

-- Anyone can read publisher profiles (for public /q/[username] page)
CREATE POLICY "publishers: public read"
  ON publishers FOR SELECT
  USING (true);

-- Only the publisher can insert/update their own row
CREATE POLICY "publishers: insert own"
  ON publishers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "publishers: update own"
  ON publishers FOR UPDATE
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_publishers_username
  ON publishers (username);


-- ── 2. published_quizzes ──────────────────────────────────────
-- Publisher-created quizzes. Questions stored as JSONB.

CREATE TABLE IF NOT EXISTS published_quizzes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publisher_id   UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  slug           TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  source_url     TEXT,
  topic          TEXT,
  tags           JSONB NOT NULL DEFAULT '[]',
  emoji          TEXT NOT NULL DEFAULT '📝',
  duration_s     INTEGER NOT NULL DEFAULT 600,
  pass_mark      INTEGER NOT NULL DEFAULT 70,
  questions      JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published')),
  attempt_count  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (publisher_id, slug)
);

ALTER TABLE published_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes: public read published"  ON published_quizzes;
DROP POLICY IF EXISTS "quizzes: publisher read own"     ON published_quizzes;
DROP POLICY IF EXISTS "quizzes: publisher insert"       ON published_quizzes;
DROP POLICY IF EXISTS "quizzes: publisher update"       ON published_quizzes;
DROP POLICY IF EXISTS "quizzes: publisher delete"       ON published_quizzes;

-- Anyone can read published quizzes
CREATE POLICY "quizzes: public read published"
  ON published_quizzes FOR SELECT
  USING (status = 'published');

-- Publisher can read all their own quizzes (including drafts)
CREATE POLICY "quizzes: publisher read own"
  ON published_quizzes FOR SELECT
  USING (auth.uid() = publisher_id);

CREATE POLICY "quizzes: publisher insert"
  ON published_quizzes FOR INSERT
  WITH CHECK (auth.uid() = publisher_id);

CREATE POLICY "quizzes: publisher update"
  ON published_quizzes FOR UPDATE
  USING (auth.uid() = publisher_id);

CREATE POLICY "quizzes: publisher delete"
  ON published_quizzes FOR DELETE
  USING (auth.uid() = publisher_id);

CREATE INDEX IF NOT EXISTS idx_published_quizzes_publisher
  ON published_quizzes (publisher_id);

CREATE INDEX IF NOT EXISTS idx_published_quizzes_status
  ON published_quizzes (status);

CREATE INDEX IF NOT EXISTS idx_published_quizzes_slug
  ON published_quizzes (publisher_id, slug);


-- ── 3. published_quiz_attempts ────────────────────────────────
-- Reader attempts on publisher quizzes.
-- user_id is NULL for guest attempts.

CREATE TABLE IF NOT EXISTS published_quiz_attempts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id       UUID NOT NULL REFERENCES published_quizzes(id) ON DELETE CASCADE,
  publisher_id  UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  score         INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  percentage    INTEGER NOT NULL,
  passed        BOOLEAN NOT NULL DEFAULT false,
  answers       JSONB,
  time_taken_s  INTEGER,
  attempted_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE published_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attempts: publisher read own quiz attempts" ON published_quiz_attempts;
DROP POLICY IF EXISTS "attempts: user read own"                   ON published_quiz_attempts;
DROP POLICY IF EXISTS "attempts: anyone insert"                   ON published_quiz_attempts;

-- Publisher can read all attempts on their quizzes (for analytics)
CREATE POLICY "attempts: publisher read own quiz attempts"
  ON published_quiz_attempts FOR SELECT
  USING (auth.uid() = publisher_id);

-- Signed-in readers can read their own attempts
CREATE POLICY "attempts: user read own"
  ON published_quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone (including guests via service role) can insert attempts
-- Note: for guest inserts use Supabase service role key server-side
CREATE POLICY "attempts: anyone insert"
  ON published_quiz_attempts FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pqa_quiz_id
  ON published_quiz_attempts (quiz_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_pqa_publisher_id
  ON published_quiz_attempts (publisher_id);

CREATE INDEX IF NOT EXISTS idx_pqa_user_id
  ON published_quiz_attempts (user_id)
  WHERE user_id IS NOT NULL;


-- ── 4. Auto-update updated_at timestamps ─────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS publishers_updated_at ON publishers;
CREATE TRIGGER publishers_updated_at
  BEFORE UPDATE ON publishers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS published_quizzes_updated_at ON published_quizzes;
CREATE TRIGGER published_quizzes_updated_at
  BEFORE UPDATE ON published_quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 5. Verify ─────────────────────────────────────────────────

SELECT
  table_name,
  COUNT(column_name) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'publishers',
    'published_quizzes',
    'published_quiz_attempts'
  )
GROUP BY table_name
ORDER BY table_name;

-- Expected:
-- published_quiz_attempts | 10
-- published_quizzes       | 14
-- publishers              | 9
