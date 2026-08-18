-- Add Stripe fields to publishers table
ALTER TABLE publishers
  ADD COLUMN IF NOT EXISTS
    stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS
    stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS
  idx_publishers_stripe_customer
  ON publishers (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Run in Supabase SQL Editor
