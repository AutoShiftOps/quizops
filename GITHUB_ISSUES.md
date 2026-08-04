# QuizOps — Phase 1 Publisher MVP
# GitHub Issues Tracker
# Copy each issue block into GitHub → Issues → New Issue

---

## EPIC: Publisher MVP — AI-Powered Quiz Generation
**Label:** `epic` `phase-1`
**Milestone:** Publisher MVP v1.0

---

### ISSUE #1 — Database: Publisher schema migration
**Label:** `database` `p0` `backend`
**Milestone:** Publisher MVP v1.0

**Description:**
Create the three new tables required for the publisher feature:
`publishers`, `published_quizzes`, `published_quiz_attempts`

**Acceptance criteria:**
- [ ] `publishers` table created with correct columns and RLS
- [ ] `published_quizzes` table created with correct columns and RLS
- [ ] `published_quiz_attempts` table created with correct columns and RLS
- [ ] All tables have RLS enabled with correct policies
- [ ] `quiz_count` auto-increments on publish via trigger or app logic
- [ ] Migration file saved at `supabase/migrations/003_publisher_mvp.sql`
- [ ] `supabase/schema.sql` updated to include new tables
- [ ] Verify query returns all 3 new tables in Supabase Table Editor

**Related files:**
- `supabase/migrations/003_publisher_mvp.sql`
- `supabase/schema.sql`

---

### ISSUE #2 — API: Article fetch + AI question generation (streaming)
**Label:** `api` `ai` `p0` `backend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #1

**Description:**
Build `POST /api/generate` — fetches article from URL,
extracts text, calls OpenAI API with streaming,
returns NDJSON stream of questions one by one.

> Note: switch to `ANTHROPIC_API_KEY` when the first paid customer is
> onboarded — see `.env.example` for the provider-swap pattern.

**Acceptance criteria:**
- [ ] URL provided → fetches HTML, strips to plain text
- [ ] If URL fetch fails → returns `{ error: 'fetch_failed' }` so frontend shows paste fallback
- [ ] Calls `gpt-4o-mini` (OpenAI) with streaming enabled
- [ ] Returns `ReadableStream` of NDJSON (one question object per line)
- [ ] Each question matches `Question` type in `lib/types.ts`
- [ ] `OPENAI_API_KEY` read from env vars — never exposed to browser
- [ ] Rate limited to prevent abuse (max 3 requests per user per hour on free tier)
- [ ] Handles API errors gracefully with meaningful error messages
- [ ] Tested with a real autoshiftops.com article URL

**Related files:**
- `app/api/generate/route.ts`
- `lib/types.ts`
- `.env.example` (add `OPENAI_API_KEY`)

---

### ISSUE #3 — Auth: Publisher role and onboarding
**Label:** `auth` `p0` `backend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #1

**Description:**
When a signed-in user first visits `/dashboard`,
check if they have a `publishers` row. If not,
show a one-time onboarding form to claim their
username and display name.

**Acceptance criteria:**
- [ ] `/dashboard` checks for publisher profile via Supabase
- [ ] New publisher → onboarding modal: username + display name
- [ ] Username validated: 3–20 chars, alphanumeric + hyphens only, unique
- [ ] On submit → creates `publishers` row, redirects to dashboard
- [ ] Existing publisher → goes straight to dashboard
- [ ] Username shown in nav when on dashboard pages
- [ ] Reader-only users (no publisher row) cannot access `/dashboard/new`

**Related files:**
- `app/dashboard/page.tsx`
- `components/PublisherOnboarding.tsx`
- `lib/publisher.ts`

---

### ISSUE #4 — UI: Publisher dashboard home
**Label:** `ui` `p0` `frontend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #3

**Description:**
Build `/dashboard` — publisher's home showing
their quizzes, stats summary, tier status,
and create button.

**Acceptance criteria:**
- [ ] Shows publisher display name and username
- [ ] Tier badge: "Free · 1 of 3 quizzes used" or "Pro · Unlimited"
- [ ] [+ Create quiz from article] CTA button prominent at top
- [ ] Lists all published and draft quizzes as cards
- [ ] Each quiz card shows: title, source URL, attempt count, pass rate, status badge
- [ ] Each quiz card has: [View] [Edit] [Analytics] [Share] actions
- [ ] Empty state when no quizzes yet — encouraging copy + create CTA
- [ ] Free tier limit reached → create button disabled + upgrade prompt
- [ ] Responsive on mobile

**Related files:**
- `app/dashboard/page.tsx`
- `components/PublisherQuizCard.tsx`
- `components/TierBadge.tsx`

---

### ISSUE #5 — UI: Create quiz flow with streaming AI
**Label:** `ui` `ai` `p0` `frontend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #2, #4

**Description:**
Build `/dashboard/new` — the full create flow:
URL input → AI generation with streaming UI →
editable question review → publish → share screen.

**Acceptance criteria:**
**Step 1 — Input:**
- [ ] URL input field with "Generate quiz →" button
- [ ] "Or paste article text" toggle below
- [ ] Paste textarea shown when URL fetch fails (fallback)
- [ ] Question count selector: 5 / 10 / 15 (default 10)
- [ ] Validates URL format before submitting

**Step 2 — Streaming generation:**
- [ ] Loading state starts immediately on submit
- [ ] Questions stream in one by one as Claude generates
- [ ] Each question appears with a subtle fade-in animation
- [ ] Shows "✓ Q1: [question text truncated]" as each arrives
- [ ] Shows "⟳ Generating Q{n}..." for current in-progress
- [ ] Progress indicator: "Generated 4 of 10 questions"
- [ ] If stream errors → show error + "Try again" button

**Step 3 — Review and edit:**
- [ ] All generated questions shown as editable cards
- [ ] Each card: question text, 4 options, correct answer selector, explanation
- [ ] [Edit] opens inline editing of any field
- [ ] [Delete] removes a question
- [ ] [+ Add question] adds a blank question card
- [ ] [↺ Regenerate] clears all and starts over
- [ ] Quiz metadata fields: title, description, emoji, duration, pass mark
- [ ] Source URL pre-filled from input step

**Step 4 — Publish:**
- [ ] [Publish quiz →] button at bottom
- [ ] Calls `POST /api/publish`
- [ ] On success → publish success screen

**Step 5 — Share screen:**
- [ ] Shows live quiz URL: `quiz.autoshiftops.com/q/[username]/[slug]`
- [ ] [Copy link] button
- [ ] Embed HTML snippet with [Copy embed] button
- [ ] Badge markdown with [Copy badge] button
- [ ] [View quiz →] link opens quiz in new tab
- [ ] [Go to dashboard] link

**Related files:**
- `app/dashboard/new/page.tsx`
- `components/GenerationStream.tsx`
- `components/QuestionEditor.tsx`
- `components/SharePanel.tsx`

---

### ISSUE #6 — API: Publish quiz endpoint
**Label:** `api` `p0` `backend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #1, #3

**Description:**
Build `POST /api/publish` — validates and saves
a quiz to `published_quizzes`, enforces free
tier limits, returns the live quiz URL.

**Acceptance criteria:**
- [ ] Authenticates publisher from session
- [ ] Enforces free tier: rejects if `quiz_count >= 3` and `tier = 'free'`
- [ ] Validates: title required, min 3 questions, all questions have 4 options
- [ ] Auto-generates slug from title if not provided (slugify)
- [ ] Ensures slug unique per publisher (appends -2, -3 if needed)
- [ ] Saves to `published_quizzes` with `status = 'published'`
- [ ] Increments `publishers.quiz_count`
- [ ] Returns `{ url, embedHtml, badgeMarkdown }`
- [ ] Idempotent: re-publishing same quiz updates, not duplicates

**Related files:**
- `app/api/publish/route.ts`
- `lib/publisher.ts`

---

### ISSUE #7 — UI: Public reader quiz page
**Label:** `ui` `p0` `frontend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #1, #6

**Description:**
Build `/q/[username]/[slug]` — the public page
readers land on from article links. Uses existing
QuizEngine component with published quiz data.

**Acceptance criteria:**
- [ ] Loads quiz from `published_quizzes` by username + slug
- [ ] Shows publisher name + source article link at top
- [ ] Renders existing `QuizEngine` component (practice mode)
- [ ] Guest mode works — no login required to attempt
- [ ] Signed-in users have attempts saved to `published_quiz_attempts`
- [ ] "Powered by QuizOps" attribution at bottom (free tier quizzes)
- [ ] "Read the original article →" link on results screen
- [ ] 404 for unknown username or slug
- [ ] OG meta tags: quiz title, publisher name, source URL
- [ ] Increments `attempt_count` on quiz record on completion

**Related files:**
- `app/q/[username]/[slug]/page.tsx`
- `lib/publishedQuiz.ts`

---

### ISSUE #8 — UI: Edit published quiz
**Label:** `ui` `p1` `frontend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #6, #7

**Description:**
Build `/dashboard/quiz/[id]` — publisher can
edit title, description, questions after publishing.

**Acceptance criteria:**
- [ ] Pre-fills all fields from existing quiz data
- [ ] Same question editor UI as create flow (#5)
- [ ] [Save changes] updates `published_quizzes` row
- [ ] [Unpublish] sets `status = 'draft'` (removes from public)
- [ ] [Delete quiz] with confirm modal — deletes record, decrements quiz_count
- [ ] Publisher can only edit their own quizzes (enforced server-side)
- [ ] Shows last updated timestamp

**Related files:**
- `app/dashboard/quiz/[id]/page.tsx`

---

### ISSUE #9 — UI: Quiz analytics page
**Label:** `ui` `p1` `frontend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #7

**Description:**
Build `/dashboard/quiz/[id]/analytics` — shows
attempt data for a published quiz.

**Acceptance criteria:**
- [ ] Total attempts count
- [ ] Average score and pass rate
- [ ] Score distribution chart (bar chart: 0-10%, 10-20% ... 90-100%)
- [ ] Most missed questions (sorted by % wrong)
- [ ] Attempts over time (line chart, last 30 days)
- [ ] Free tier: last 7 days only, Pro: full history
- [ ] Empty state when no attempts yet

**Related files:**
- `app/dashboard/quiz/[id]/analytics/page.tsx`
- `components/AnalyticsCharts.tsx`

---

### ISSUE #10 — UI: Publisher profile page
**Label:** `ui` `p1` `frontend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #7

**Description:**
Build `/q/[username]` — public profile showing
all a publisher's published quizzes.

**Acceptance criteria:**
- [ ] Shows publisher display name, bio, website link
- [ ] Lists all published quizzes as cards (not drafts)
- [ ] Each card links to `/q/[username]/[slug]`
- [ ] Shows attempt count and pass rate per quiz
- [ ] 404 for unknown username
- [ ] OG meta: publisher name + "Quizzes on QuizOps"

**Related files:**
- `app/q/[username]/page.tsx`

---

### ISSUE #11 — API: SVG badge endpoint
**Label:** `api` `p2` `backend`
**Milestone:** Publisher MVP v1.0
**Depends on:** #7

**Description:**
Build `GET /api/badge/[username]/[slug]` —
returns a dynamic SVG badge showing quiz stats.
Embeddable in articles and READMEs.

**Acceptance criteria:**
- [ ] Returns `Content-Type: image/svg+xml`
- [ ] Shows: "QuizOps | DevOps CI/CD | 47 attempts"
- [ ] Matches autoshiftops.com colour scheme
- [ ] Cached: `Cache-Control: s-maxage=3600`
- [ ] Returns fallback badge if quiz not found

**Related files:**
- `app/api/badge/[username]/[slug]/route.ts`

---

### ISSUE #12 — Docs: Update README and CONTRIBUTING
**Label:** `docs` `p1`
**Milestone:** Publisher MVP v1.0

**Description:**
Update README.md and CONTRIBUTING.md to reflect
the publisher feature and new env vars.

**Acceptance criteria:**
- [ ] README covers both reader and publisher flows
- [ ] New env vars `AI_PROVIDER`, `AI_MODEL`, `OPENAI_API_KEY` documented
      (note the switch to `ANTHROPIC_API_KEY` for when the first paid
      customer is onboarded)
- [ ] Publisher onboarding steps documented
- [ ] CONTRIBUTING.md updated — both JSON bank contribution
  AND publisher dashboard for non-technical users
- [ ] Architecture diagram or description updated

**Related files:**
- `README.md`
- `CONTRIBUTING.md`

---

## LABELS TO CREATE IN GITHUB

| Label | Color | Description |
|-------|-------|-------------|
| `epic` | #8B5CF6 | Large feature grouping |
| `p0` | #EF4444 | Must ship in MVP |
| `p1` | #F59E0B | High priority |
| `p2` | #6B7280 | Nice to have |
| `backend` | #3B82F6 | Server-side work |
| `frontend` | #10B981 | UI work |
| `api` | #6366F1 | API route |
| `database` | #0EA5E9 | Schema/migration |
| `ai` | #A855F7 | AI/Claude integration |
| `auth` | #EC4899 | Authentication |
| `ui` | #14B8A6 | Component work |
| `docs` | #84CC16 | Documentation |
| `phase-1` | #1D4ED8 | Phase 1 scope |
| `bug` | #DC2626 | Bug fix |

---

## MILESTONE

**Name:** Publisher MVP v1.0
**Due date:** TBD
**Description:** First version of publisher 
feature — AI quiz generation, dashboard, 
public reader pages, share/embed.

**P0 issues (must ship):** #1 #2 #3 #4 #5 #6 #7
**P1 issues (should ship):** #8 #9 #10 #12
**P2 issues (nice to have):** #11
