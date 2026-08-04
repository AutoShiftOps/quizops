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

-- ── Publisher MVP ──────────────────────────────────────────────
-- One row per publisher. Created on first dashboard visit.

create table if not exists publishers (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text not null unique,
  display_name  text not null,
  bio           text,
  website_url   text,
  tier          text not null default 'free'
                  check (tier in ('free', 'pro', 'team')),
  quiz_count    integer not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_publishers_username
  on publishers (username);

-- Publisher-created quizzes. Questions stored as JSONB.

create table if not exists published_quizzes (
  id             uuid default gen_random_uuid() primary key,
  publisher_id   uuid not null references publishers (id) on delete cascade,
  slug           text not null,
  title          text not null,
  description    text,
  source_url     text,
  topic          text,
  tags           jsonb not null default '[]',
  emoji          text not null default '📝',
  duration_s     integer not null default 600,
  pass_mark      integer not null default 70,
  questions      jsonb not null default '[]',
  status         text not null default 'draft'
                   check (status in ('draft', 'published')),
  attempt_count  integer not null default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (publisher_id, slug)
);

create index if not exists idx_published_quizzes_publisher
  on published_quizzes (publisher_id);

create index if not exists idx_published_quizzes_status
  on published_quizzes (status);

create index if not exists idx_published_quizzes_slug
  on published_quizzes (publisher_id, slug);

-- Reader attempts on publisher quizzes. user_id is NULL for guest attempts.

create table if not exists published_quiz_attempts (
  id            uuid default gen_random_uuid() primary key,
  quiz_id       uuid not null references published_quizzes (id) on delete cascade,
  publisher_id  uuid not null references publishers (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete set null,
  score         integer not null,
  total         integer not null,
  percentage    integer not null,
  passed        boolean not null default false,
  answers       jsonb,
  time_taken_s  integer,
  attempted_at  timestamptz default now()
);

create index if not exists idx_pqa_quiz_id
  on published_quiz_attempts (quiz_id, attempted_at desc);

create index if not exists idx_pqa_publisher_id
  on published_quiz_attempts (publisher_id);

create index if not exists idx_pqa_user_id
  on published_quiz_attempts (user_id)
  where user_id is not null;

alter table quiz_attempts enable row level security;
alter table quiz_progress enable row level security;
alter table publishers enable row level security;
alter table published_quizzes enable row level security;
alter table published_quiz_attempts enable row level security;

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

-- Anyone can read publisher profiles (for public /q/[username] page)
create policy "publishers: public read"
  on publishers for select
  using (true);

-- Only the publisher can insert/update their own row
create policy "publishers: insert own"
  on publishers for insert
  with check (auth.uid() = id);

create policy "publishers: update own"
  on publishers for update
  using (auth.uid() = id);

-- Anyone can read published quizzes
create policy "quizzes: public read published"
  on published_quizzes for select
  using (status = 'published');

-- Publisher can read all their own quizzes (including drafts)
create policy "quizzes: publisher read own"
  on published_quizzes for select
  using (auth.uid() = publisher_id);

create policy "quizzes: publisher insert"
  on published_quizzes for insert
  with check (auth.uid() = publisher_id);

create policy "quizzes: publisher update"
  on published_quizzes for update
  using (auth.uid() = publisher_id);

create policy "quizzes: publisher delete"
  on published_quizzes for delete
  using (auth.uid() = publisher_id);

-- Publisher can read all attempts on their quizzes (for analytics)
create policy "attempts: publisher read own quiz attempts"
  on published_quiz_attempts for select
  using (auth.uid() = publisher_id);

-- Signed-in readers can read their own attempts
create policy "attempts: user read own"
  on published_quiz_attempts for select
  using (auth.uid() = user_id);

-- Anyone (including guests via service role) can insert attempts
-- Note: for guest inserts use Supabase service role key server-side
create policy "attempts: anyone insert"
  on published_quiz_attempts for insert
  with check (true);

-- Auto-update updated_at timestamps

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists publishers_updated_at on publishers;
create trigger publishers_updated_at
  before update on publishers
  for each row execute function update_updated_at();

drop trigger if exists published_quizzes_updated_at on published_quizzes;
create trigger published_quizzes_updated_at
  before update on published_quizzes
  for each row execute function update_updated_at();
