-- Migration 005: Pro waitlist
-- Run in Supabase SQL Editor before deploying
-- Already executed in production

CREATE TABLE IF NOT EXISTS waitlist (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  website_url  TEXT,
  tier         TEXT NOT NULL DEFAULT 'pro',
  source       TEXT DEFAULT 'pricing',
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Note: reads are service-role only (admin)
