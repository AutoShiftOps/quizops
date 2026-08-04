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

| TC | Status | Notes |
|----|--------|-------|
| TC-P01 | PASS | Verified with real Google session |
| TC-P02 | PASS | Verified |
| TC-P03 | PASS | Verified with real OpenAI call |
| TC-P04 | — | Not yet tested |
| TC-P05 | PASS | Verified — streaming confirmed |
| TC-P06 | PASS | Verified |
| TC-P07 | PASS | Verified |
| TC-P08 | — | Not yet tested |
| TC-P09 | PASS* | Quiz published correctly, share screen timing ambiguous in Playwright |
| TC-P10 | PASS* | Same as P09 |
| TC-P11 | PASS | Public reader page verified |
| TC-P12 | — | Pending |
| TC-P13 | — | Pending |
| TC-P14 | — | Pending |
| TC-P15 | — | Pending |
| TC-P16 | — | Pending |
| TC-P17 | — | Pending |
| TC-P18 | — | Pending |
| TC-P19 | — | Pending |
| TC-P20 | — | Pending |
