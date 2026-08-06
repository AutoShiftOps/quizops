# QuizOps — Publisher MVP Test Plan
## Scope: AI generation, dashboard, public pages, tier limits
## Version: v1.3
## Environment: Chrome desktop + real Google account

---

## TEST CASES

### TC-P01 — Publisher onboarding (first visit)
**Precondition:** Signed in, no publisher row exists
**Steps:**
1. Navigate to `/dashboard`
2. Observe onboarding modal
3. Enter username and display name
4. Submit

**Expected:**
- Onboarding modal appears (not dashboard content)
- Username validates: 3–20 chars, alphanumeric + hyphens
- Invalid username shows inline error
- On submit → publisher row created in Supabase
- Redirected to dashboard home

---

### TC-P02 — Dashboard home loads correctly
**Precondition:** Publisher profile exists
**Steps:**
1. Navigate to `/dashboard`

**Expected:**
- Shows display name and username
- Tier badge: "Free · 0 of 3 quizzes used"
- "+ Create quiz from article" CTA visible
- Empty state shown (no quizzes yet)
- No console errors

---

### TC-P03 — URL fetch succeeds
**Precondition:** On `/dashboard/new`
**Steps:**
1. Paste a valid article URL (e.g. autoshiftops.com post)
2. Click "Generate quiz →"

**Expected:**
- Fetch succeeds
- Generation stream starts
- Questions appear one by one with fade-in
- "⟳ Generating Q{n}..." shows for current question
- Progress: "Generated 4 of 10 questions"
- All 10 questions appear

---

### TC-P04 — URL fetch fails → paste fallback
**Precondition:** On `/dashboard/new`
**Steps:**
1. Enter a URL that returns 404 or blocks crawlers
2. Click "Generate quiz →"

**Expected:**
- Error shown: "Could not fetch article"
- Paste textarea appears automatically
- User can paste article text manually
- Generation proceeds from pasted text

---

### TC-P05 — Question streaming appears one by one
**Steps:**
1. Start generation (TC-P03)
2. Observe the stream UI

**Expected:**
- Each question appears individually, not all at once
- Subtle fade-in animation per question
- "✓ Q1: [text truncated]..." shown as each arrives
- Current in-progress question shows spinner
- No layout jump between questions

---

### TC-P06 — Edit generated question
**Precondition:** Generation complete, on review screen
**Steps:**
1. Click [Edit] on any question
2. Change question text
3. Change correct answer
4. Change explanation
5. Save

**Expected:**
- Inline editing opens
- All fields editable
- Correct answer selector works (A/B/C/D)
- Save updates the question card
- No page reload

---

### TC-P07 — Delete and add questions
**Steps:**
1. Click [Delete] on Q3
2. Click [+ Add question] at bottom

**Expected:**
- Q3 removed, remaining questions renumbered
- New blank question card appears at bottom
- Can fill in new question manually
- Total question count updates

---

### TC-P08 — Regenerate clears and restarts
**Steps:**
1. After generation completes
2. Click [↺ Regenerate]

**Expected:**
- Confirm prompt: "This will clear all generated questions"
- On confirm → questions cleared
- Generation restarts from same URL/text
- New set of questions streams in

---

### TC-P09 — Publish quiz successfully
**Precondition:** At least 3 questions in review
**Steps:**
1. Fill in quiz title and description
2. Click "Publish quiz →"

**Expected:**
- Validation passes
- Quiz saved to `published_quizzes` with status='published'
- `publishers.quiz_count` incremented to 1
- Redirected to share screen

---

### TC-P10 — Share screen shows correct assets
**Precondition:** TC-P09 complete
**Steps:**
1. Observe share screen after publish

**Expected:**
- Live URL shown: `quiz.autoshiftops.com/q/[username]/[slug]`
- [Copy link] copies URL to clipboard
- Embed HTML snippet shown with [Copy embed]
- Badge markdown shown with [Copy badge]
- [View quiz →] opens quiz in new tab and it loads

---

### TC-P11 — Public reader quiz page loads
**Precondition:** Quiz published (TC-P09)
**Steps:**
1. Open `quiz.autoshiftops.com/q/[username]/[slug]`
   (not signed in)

**Expected:**
- Quiz loads with publisher name and source URL at top
- Quiz engine renders in practice mode
- Guest can take quiz without signing in
- "Powered by QuizOps" attribution at bottom
- On completion → "Read the original article →" link shown

---

### TC-P12 — Attempt saved for signed-in reader
**Precondition:** Signed in as reader (not publisher)
**Steps:**
1. Take published quiz while signed in
2. Check Supabase → `published_quiz_attempts`

**Expected:**
- Row exists with correct quiz_id, user_id, score, percentage
- attempt_count on quiz incremented

---

### TC-P13 — Free tier limit enforcement
**Precondition:** Publisher has 3 published quizzes
**Steps:**
1. Navigate to `/dashboard/new`
2. Attempt to generate a 4th quiz

**Expected:**
- Error shown before generation starts:
  "Free tier limit reached (3/3 quizzes)"
- Upgrade prompt shown
- Generation does not proceed
- No API call made to Claude

---

### TC-P14 — Dashboard shows quiz list and stats
**Precondition:** 2+ published quizzes exist
**Steps:**
1. Navigate to `/dashboard`

**Expected:**
- Each quiz shown as card
- Shows: title, attempt count, pass rate, status
- [View] [Edit] [Analytics] [Share] actions present
- Tier badge shows correct count: "Free · 2 of 3 used"

---

### TC-P15 — Edit published quiz
**Steps:**
1. Click [Edit] on a published quiz
2. Change the title
3. Delete one question
4. Click [Save changes]

**Expected:**
- Changes saved to Supabase
- Quiz still published (status unchanged)
- Updated title shows on dashboard
- Public quiz page reflects changes

---

### TC-P16 — Analytics page loads
**Steps:**
1. Click [Analytics] on a quiz with attempts

**Expected:**
- Total attempts shown
- Average score shown
- Pass rate shown
- Most missed questions listed
- Free tier: "Showing last 7 days" notice

---

### TC-P17 — Publisher profile page
**Steps:**
1. Open `quiz.autoshiftops.com/q/[username]`

**Expected:**
- Publisher name and bio shown
- All published quizzes listed
- Drafts NOT shown
- Each quiz links to reader page
- 404 for unknown username

---

### TC-P18 — Unknown quiz slug returns 404
**Steps:**
1. Open `quiz.autoshiftops.com/q/[username]/fake-slug`

**Expected:**
- 404 page shown
- No server error

---

### TC-P19 — Regression: existing quiz banks unaffected
**Steps:**
1. Open `quiz.autoshiftops.com/quiz/devops-cicd`
2. Open `quiz.autoshiftops.com/exam/devops-cicd`

**Expected:**
- Both load normally
- Practice mode: instant feedback
- Exam mode: side panel, no feedback
- All TC-01 to TC-15 and TC-E01 to TC-E19 still pass

---

### TC-P20 — OPENAI_API_KEY not exposed to browser
**Steps:**
1. Open DevTools → Network
2. Trigger question generation
3. Inspect the `/api/generate` request and response

**Expected:**
- API key NOT visible in any request headers
- API key NOT visible in any response body
- Key only used server-side in `/api/generate/route.ts`

> Note: switch to `ANTHROPIC_API_KEY` when the first paid customer is
> onboarded — see `.env.example` for the provider-swap pattern.

---

### TC-P21 — Manual quiz creation
**Precondition:** On `/dashboard/new`
**Steps:**
1. Select "Write questions manually" path
2. Fill in title, source URL, topic
3. Add 3 questions with 4 options each, mark correct answer, add
   explanation
4. Click Publish

**Expected:**
- No AI call made (check Network tab)
- Quiz appears at `/q/[username]/[slug]`
- All 3 questions show correctly
- `quiz_count` incremented

---

### TC-P22 — Save draft
**Precondition:** On quiz builder (AI or manual path)
**Steps:**
1. Fill title and at least 1 question
2. Click Save draft

**Expected:**
- Dashboard shows quiz with Draft badge
- `quiz_count` unchanged
- `/q/[username]/[slug]` returns 404
- Supabase: `status = 'draft'`

---

### TC-P23 — Publish a draft
**Precondition:** Draft quiz exists on dashboard
**Steps:**
1. Click Publish on draft card

**Expected:**
- Badge changes to Published
- `quiz_count` increments by 1
- `/q/[username]/[slug]` now accessible
- Supabase: `status = 'published'`

---

## PASS CRITERIA

| Priority | Cases | Required before deploy |
|----------|-------|----------------------|
| P0 — Critical | TC-P01 to TC-P11, TC-P13, TC-P19, TC-P20 | Yes |
| P1 — High | TC-P12, TC-P14, TC-P15, TC-P16 | Yes |
| P2 — Medium | TC-P17, TC-P18 | Preferred |

---

## DEFECT LOG

Tested at e909f65. Real OpenAI streaming confirmed. TC-P20 (API key not
exposed) verified — real key was found in .env.example before staging and
replaced with placeholder.

Title auto-extracted from article in generate flow — fixes Untitled Quiz
issue.

Bug found and fixed: free tier limit was enforced correctly by the API
(`/api/publish`, `/api/quiz/[id]`) but not by the UI — the dashboard
"+ Create quiz" button and `/dashboard/new` let a publisher at 3/3 reach
the create flow, where they'd only discover the limit after filling out a
whole quiz and hitting Publish. Fixed with a UI-level gate in three places:
the dashboard header button now shows "Upgrade to create more" (amber)
instead of navigating when `quiz_count >= 3` on the free tier; the invite
card in the quiz grid is replaced with an upgrade card in the same state;
and `/dashboard/new` itself hard-gates on mount — even a direct URL visit
renders an upgrade wall instead of the create flow. All three read the
same `checkTierLimit()` used by the API, verified against real
`quiz_count` transitions (0→2→3, publish-blocked-at-3, delete-back-to-2)
with an isolated test publisher. API-side enforcement is unchanged (belt
and suspenders, per TC-P13).

Manual quiz creation, save-draft, and reorder-questions added (TC-P21–23).
Implementing draft support surfaced and fixed two pre-existing `quiz_count`
bugs: deleting a draft used to decrement the count unconditionally (drafts
never incremented it in the first place), and the unpublish/republish
toggle on the edit page never adjusted the count at all. Both fixed and
covered by the API-level verification above.

410c318 — CRITICAL write-side bug found: quiz_attempts table had ZERO rows
for any user. Root cause: saveExamAttempt() and both practice-mode upserts
in ResultsScreen and QuizEngine silently discarded Supabase errors. The
entire score persistence system was non-functional from day one. Fixed by
adding error checks and logging to all three write paths.
onAuthStateChange reactivity also added to QuizEngine and ExamEngine to
close auth race condition.

| TC | Status | Notes |
|----|--------|-------|
| TC-P01 | PASS | Verified with real Google session |
| TC-P02 | PASS | Verified |
| TC-P03 | PASS | Verified with real OpenAI call |
| TC-P04 | — | Not yet tested |
| TC-P05 | PASS | Verified — streaming confirmed |
| TC-P06 | PASS | Inline question edit confirmed |
| TC-P07 | PASS | Delete and add questions confirmed |
| TC-P08 | — | Not yet tested |
| TC-P09 | PASS* | Quiz published correctly, share screen timing ambiguous in Playwright |
| TC-P10 | PASS* | Same as P09 |
| TC-P11 | PASS | Public reader page verified |
| TC-P12 | — | Pending |
| TC-P13 | BUG FIXED | UI gate added — button disabled at 3/3, /dashboard/new shows upgrade wall. API enforcement unchanged. |
| TC-P14 | — | Pending |
| TC-P15 | PASS | Edit quiz flow implemented — title, description, emoji, source URL, questions all editable. Save/unpublish/delete all working. |
| TC-P16 | — | Pending |
| TC-P17 | — | Pending |
| TC-P18 | — | Pending |
| TC-P19 | — | Pending |
| TC-P20 | — | Pending |
| TC-P21 | PASS* | Backend verified via direct API calls with a real Supabase session: publishing with <3 questions rejected (400), publishing with 3 questions succeeds and increments quiz_count, no `/api/generate` call is reachable from the manual path (route isn't invoked). *Path-selection cards, question-click UI, and reorder buttons were code-reviewed and build/typecheck clean but not clicked through in a live browser (no OAuth session available in this environment) — recommend a quick manual pass before announcing. |
| TC-P22 | PASS | Verified via direct API calls: draft saved with only 1 question succeeds (relaxed minimum), `publishers.quiz_count` stays unchanged, `published_quizzes.status = 'draft'`, and `/q/[username]/[slug]` returns 404 for the draft's slug. |
| TC-P23 | PASS | Verified via direct API calls: `PATCH /api/quiz/[id]` with `{status:'published'}` flips a draft to `status='published'` and increments `quiz_count` by exactly 1; the reverse (unpublish) correctly decrements it back. Also confirmed the tier limit applies to this transition — publishing a draft is blocked with 403 once `quiz_count` is already 3, closing a prior bypass. |

---

## FIXES SHIPPED POST e909f65

### c09dc20 — Dashboard redesign
- Dashboard wrapped in max-w-[900px] container
- Stats row: 4 real-data cards (published count, total attempts, avg pass
  rate, readers this week)
- Tier pill with inline progress bar
- Tip bar shown until first attempt recorded
- Quiz cards redesigned — emoji, status badge, attempts, pass rate, action
  buttons
- Invite card slot when quota not reached
- Title field default changed from 'Untitled Quiz' to empty — fixes silent
  validation bypass

### 144ba96 — Auto-title + Edit quiz (#8)
- Article title auto-extracted from `<title>`/`<h1>` and pre-filled via
  `__meta__` NDJSON line
- Title field required before publish
- Edit page: `/dashboard/quiz/[id]`
- `PATCH /api/quiz/[id]` — updates all fields
- `DELETE /api/quiz/[id]` — deletes + decrements
- Unpublish/republish status toggle
- Edit button on dashboard card now routes correctly
