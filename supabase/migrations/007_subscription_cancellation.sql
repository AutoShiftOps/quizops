-- Track pending-cancellation state for Pro subscriptions (cancel_at_period_end)
ALTER TABLE publishers
  ADD COLUMN IF NOT EXISTS
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS
    period_end_date TIMESTAMPTZ;

-- Run in Supabase SQL Editor
