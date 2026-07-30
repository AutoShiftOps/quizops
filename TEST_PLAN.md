# QuizOps — Test Plan
## Scope: Mid-quiz persistence, Share result, Reset behaviour
## Version: v1.1 — post localStorage + share fix
## Environment: Chrome (desktop) + Safari (mobile)

---

## TEST CASES

### TC-01 — Fresh quiz start
**Precondition:** No localStorage key exists for the bank slug  
**Steps:**
1. Open `quiz.autoshiftops.com/quiz/devops-cicd`
2. Observe page load

**Expected:**
- Quiz starts at Q1
- Timer starts at full duration (20:00)
- No "resuming session" banner visible
- All question dots empty

---

### TC-02 — Mid-quiz refresh (same tab)
**Precondition:** Quiz in progress, at least 3 questions answered  
**Steps:**
1. Answer 3+ questions
2. Press F5 / Ctrl+R to refresh

**Expected:**
- Quiz resumes at the same question you were on
- Previously answered questions retain their selections
- Timer resumes from approximately where it left off (±5s)
- "Resuming your previous session" banner visible at top
- "Start fresh" link visible in banner

---

### TC-03 — Mid-quiz close and reopen (within 90 min)
**Precondition:** Quiz in progress, at least 5 questions answered  
**Steps:**
1. Answer 5+ questions
2. Close the browser tab entirely
3. Reopen `quiz.autoshiftops.com/quiz/devops-cicd` within 90 minutes

**Expected:**
- Quiz resumes at the same question
- Answered questions show correct/wrong indicators
- Timer shows remaining time (not full duration)
- Resume banner visible with "Start fresh" option

---

### TC-04 — Mid-quiz session expired (90+ min old)
**Precondition:** localStorage has a saved session older than 90 minutes  
**Steps:**
1. Manually set a stale entry in DevTools → Application → Local Storage:
   Key: `quizops_progress_devops-cicd`
   Value: `{"current":5,"selected":[0,1,null,2,null],"revealed":[true,true,false,true,false],"timeLeft":900,"savedAt":1}`
   (savedAt=1 is epoch 1970 — guaranteed stale)
2. Open `quiz.autoshiftops.com/quiz/devops-cicd`

**Expected:**
- Quiz starts fresh at Q1
- No resume banner
- Stale localStorage key is deleted
- Timer at full duration

---

### TC-05 — Start fresh from resume banner
**Precondition:** A valid mid-quiz session exists in localStorage  
**Steps:**
1. Open quiz (TC-02 or TC-03 precondition)
2. Observe resume banner
3. Click "Start fresh"

**Expected:**
- Quiz resets to Q1
- Timer resets to full duration
- All answer selections cleared
- Resume banner disappears
- localStorage key for this bank is deleted
- DevTools → Local Storage confirms key is gone

---

### TC-06 — Complete quiz clears checkpoint
**Precondition:** Quiz in progress with localStorage checkpoint  
**Steps:**
1. Answer all questions
2. Click Submit
3. Results screen appears
4. Open DevTools → Application → Local Storage

**Expected:**
- `quizops_progress_devops-cicd` key does NOT exist
- Results screen shows correct score
- Supabase `quiz_attempts` has a new/updated row

---

### TC-07 — Retry clears checkpoint
**Precondition:** On the results screen after completing a quiz  
**Steps:**
1. Complete any quiz
2. Click "Try again" on results screen
3. Open DevTools → Application → Local Storage

**Expected:**
- Quiz restarts at Q1
- Timer at full duration
- No resume banner
- localStorage key does not exist

---

### TC-08 — Multiple banks have independent checkpoints
**Precondition:** Two quiz banks available  
**Steps:**
1. Start devops-cicd quiz, answer 3 questions, leave
2. Start a second bank quiz, answer 5 questions, leave
3. Return to devops-cicd quiz

**Expected:**
- devops-cicd resumes at Q4 (where you left it)
- Second bank checkpoint unaffected
- DevTools shows two separate localStorage keys:
  `quizops_progress_devops-cicd`
  `quizops_progress_[second-bank-slug]`

---

### TC-09 — Share result on desktop
**Precondition:** On results screen, using Chrome/Firefox on desktop  
**Steps:**
1. Complete any quiz
2. Click "Share result"

**Expected:**
- Button text changes to "Copied!" for ~2.5 seconds
- Clipboard contains formatted text:
  ```
  ✅ Passed the DevOps & CI/CD Fundamentals quiz on QuizOps!
  Score: 15/20 (75%)
  
  Test your knowledge → https://quiz.autoshiftops.com/quiz/devops-cicd
  ```
  (or ❌ / 📚 if failed)
- After 2.5s button reverts to "Share result"
- Pasting clipboard into any app shows the formatted text

---

### TC-10 — Share result on mobile (native sheet)
**Precondition:** On results screen, using Safari/Chrome on iOS or Android  
**Steps:**
1. Complete any quiz on mobile
2. Tap "Share result"

**Expected:**
- Native OS share sheet opens (not clipboard copy)
- Share sheet shows formatted text with link
- Can share to WhatsApp, Messages, LinkedIn etc
- If user cancels share sheet — no error, button reverts normally

---

### TC-11 — Share failed quiz
**Precondition:** Complete a quiz with score below pass mark (70%)  
**Steps:**
1. Deliberately answer most questions wrong
2. Submit
3. Click "Share result"

**Expected:**
- Share text uses 📚 emoji instead of ✅
- Text says "Attempted" not "Passed"
- Score and link still correct

---

### TC-12 — Guest mode (no login) — persistence still works
**Precondition:** Not signed in  
**Steps:**
1. Open quiz without signing in
2. Answer 5 questions
3. Refresh page

**Expected:**
- Mid-quiz state restores from localStorage (same as TC-02)
- No Supabase errors in console
- On completion — score shown on results screen
- Supabase save is skipped silently (guest mode)
- localStorage checkpoint cleared on submit

---

### TC-13 — Signed-in user — Supabase save on completion
**Precondition:** Signed in with Google  
**Steps:**
1. Complete any quiz
2. Check Supabase Table Editor → quiz_attempts

**Expected:**
- Row exists with correct user_id, bank_slug, score, total, percentage, passed
- completed_at is recent timestamp
- If quiz was taken before — row is updated (upsert), not duplicated

---

### TC-14 — Back navigation mid-quiz
**Precondition:** Quiz in progress  
**Steps:**
1. Answer 3 questions
2. Click browser back button
3. Click forward button to return to quiz

**Expected:**
- Quiz resumes from localStorage checkpoint
- Resume banner visible
- No data loss

---

### TC-15 — Regression — existing quiz flow unaffected
**Precondition:** Clean state  
**Steps:**
1. Start quiz
2. Answer all 20 questions without leaving
3. Submit
4. Review wrong answers on results screen

**Expected:**
- All existing behaviour intact
- Timer works correctly
- Progress dots update correctly
- Instant feedback + explanation shows after each answer
- Results show score circle, pass/fail, wrong answer review
- "Read original post" link shows if source_url set

---

## PASS CRITERIA

All 15 test cases must pass before merging to main.

| Priority | Cases | Must pass before deploy |
|----------|-------|------------------------|
| P0 — Critical | TC-02, TC-06, TC-09, TC-13, TC-15 | Yes |
| P1 — High | TC-01, TC-03, TC-05, TC-07, TC-12 | Yes |
| P2 — Medium | TC-04, TC-08, TC-10, TC-11, TC-14 | Preferred |

---

## KNOWN LIMITATIONS

- TC-04 requires manual DevTools manipulation (no automated way to fake time)
- TC-10 mobile share requires a real device or BrowserStack — cannot be tested in desktop Chrome DevTools mobile emulation (navigator.share is blocked in emulated mode)
- Timer restoration is approximate (±5s) due to the interval between saves — this is acceptable

---

## HOW TO RUN

### Manual (Playwright smoke test)
```bash
cd quizops
npx playwright test tests/quiz-persistence.spec.ts
npx playwright test tests/share-result.spec.ts
```

### Manual (browser)
Work through TC-01 to TC-15 in order using the checklist above.
Mark each as PASS / FAIL / SKIP with notes.

---

## DEFECT LOG

| TC | Status | Notes |
|----|--------|-------|
| TC-01 | — | |
| TC-02 | — | |
| TC-03 | — | |
| TC-04 | — | |
| TC-05 | — | |
| TC-06 | — | |
| TC-07 | — | |
| TC-08 | — | |
| TC-09 | — | |
| TC-10 | — | |
| TC-11 | — | |
| TC-12 | — | |
| TC-13 | — | |
| TC-14 | — | |
| TC-15 | — | |
