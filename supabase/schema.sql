-- QuizOps Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) against your project.

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  bank_slug text not null,
  score integer not null,
  total integer not null,
  percentage integer not null,
  passed boolean not null default false,
  answers jsonb,
  time_taken_s integer,
  completed_at timestamptz default now(),
  mode text not null default 'practice',
  violation_count integer not null default 0,
  auto_submitted boolean not null default false,
  flagged_questions jsonb default '[]',
  unique (user_id, bank_slug, mode)
);

create table if not exists quiz_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text,
  banks_done jsonb default '{}',
  weak_tags jsonb default '[]',
  total_taken integer default 0,
  streak integer default 0,
  last_active date,
  updated_at timestamptz default now()
);

alter table quiz_attempts enable row level security;
alter table quiz_progress enable row level security;

create policy "Users manage their own quiz_attempts"
  on quiz_attempts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own quiz_progress"
  on quiz_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
