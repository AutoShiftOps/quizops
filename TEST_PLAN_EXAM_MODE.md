# QuizOps — Exam Mode Test Plan
## Scope: Exam mode, question navigation, flagging, proctoring
## Version: v1.2
## Environment: Chrome desktop (primary), Safari mobile (secondary)

---

## FEATURES UNDER TEST

1. Mode selection — separate URLs (/quiz vs /exam)
2. Exam UI — side panel navigation, flag/unflag
3. Answer editing — go back and change answers
4. Proctored enforcement — fullscreen + tab switch (3-strike)
5. Auto-submit — on timer expiry or 3rd violation
6. Results — violation count, review all answers

---

## TEST CASES

### TC-E01 — Homepage shows both CTAs per bank
**Steps:**
1. Open `quiz.autoshiftops.com`
2. Observe bank cards

**Expected:**
- Each card has two buttons: "Practice" and "Take Exam"
- Practice → `/quiz/devops-cicd`
- Take Exam → `/exam/devops-cicd`

---

### TC-E02 — Exam mode URL loads correctly
**Steps:**
1. Open `/exam/devops-cicd` directly

**Expected:**
- Exam start screen appears (not quiz)
- Shows: bank name, question count, duration, rules summary
- "Start Exam" button → requests fullscreen
- No instant feedback mentioned in rules

---

### TC-E03 — Fullscreen requested on exam start
**Steps:**
1. Click "Start Exam"

**Expected:**
- Browser requests fullscreen
- If user allows → exam begins in fullscreen
- If user denies → warning shown, exam still starts (can't force)
- Timer starts only after fullscreen granted or user confirms

---

### TC-E04 — Side panel visible with all question numbers
**Steps:**
1. Start exam
2. Observe left/right side panel

**Expected:**
- Panel shows all 20 question numbers as a grid
- Each number has a state indicator:
  - Grey — unanswered
  - Blue — answered
  - Orange — flagged
  - Green — answered + flagged (for review)
- Current question highlighted with accent border
- Clicking any number jumps to that question instantly

---

### TC-E05 — Answer a question and go back to change it
**Steps:**
1. Answer Q1 (select option B)
2. Navigate to Q2 via side panel or Next button
3. Navigate back to Q1
4. Select option A instead

**Expected:**
- Q1 shows option A selected (not B)
- No instant feedback shown (exam mode)
- No explanation shown
- Side panel shows Q1 as answered (blue)
- Answer change is saved in state

---

### TC-E06 — Flag and unflag a question
**Steps:**
1. On Q3, click the flag icon
2. Navigate away to Q5
3. Return to Q3
4. Click flag icon again

**Expected:**
- First click: Q3 shows flagged state (orange indicator)
- Side panel shows Q3 in orange
- Second click: Q3 unflagged, returns to answered/unanswered state
- Side panel updates accordingly

---

### TC-E07 — Review flagged questions before submit
**Steps:**
1. Answer all 20 questions
2. Flag 3 questions
3. Click "Submit Exam"

**Expected:**
- Before final submission, a review modal appears:
  "You have 3 flagged questions. Review them before submitting?"
  Buttons: "Review flagged" | "Submit anyway"
- "Review flagged" → jumps to first flagged question
- "Submit anyway" → proceeds to submission

---

### TC-E08 — Submit with unanswered questions
**Steps:**
1. Answer only 15 of 20 questions
2. Click "Submit Exam"

**Expected:**
- Warning modal: "5 questions unanswered. Submit anyway?"
- If flagged AND unanswered: shows both warnings
- "Go back" → returns to first unanswered question
- "Submit anyway" → submits with unanswered counted as wrong

---

### TC-E09 — First fullscreen exit (grace warning)
**Precondition:** Exam in progress in fullscreen  
**Steps:**
1. Press ESC or exit fullscreen

**Expected:**
- Timer pauses immediately
- Modal appears: "You left the exam window (Warning 1 of 3)"
- "Return to Exam" button
- Clicking return → fullscreen re-requested → timer resumes
- Warning count shown in exam UI: "⚠️ 1 warning"

---

### TC-E10 — Second fullscreen exit
**Precondition:** Already received 1 warning  
**Steps:**
1. Exit fullscreen again

**Expected:**
- Timer pauses
- Modal: "You left the exam window (Warning 2 of 3)"
- "Return to Exam" button
- Warning count in UI: "⚠️ 2 warnings"

---

### TC-E11 — Third fullscreen exit (auto-submit)
**Precondition:** Already received 2 warnings  
**Steps:**
1. Exit fullscreen a third time

**Expected:**
- Exam auto-submits immediately (no modal, no choice)
- Results screen shows with current answers
- Banner on results: "Exam ended: focus limit reached (3 violations)"
- Supabase row has violation_count: 3, auto_submitted: true

---

### TC-E12 — Tab switch counts as violation
**Precondition:** Exam in progress  
**Steps:**
1. Press Ctrl+Tab or click another browser tab

**Expected:**
- Same 3-strike behaviour as fullscreen exit
- Timer pauses on tab switch
- Warning modal on return
- Third tab switch triggers auto-submit

---

### TC-E13 — Fullscreen + tab switch strikes are combined
**Precondition:** Exam in progress  
**Steps:**
1. Exit fullscreen once (warning 1)
2. Return to exam
3. Switch tab (warning 2)
4. Return to exam
5. Exit fullscreen again (warning 3 → auto-submit)

**Expected:**
- All three violations combined into one 3-strike count
- Auto-submit on third violation regardless of type

---

### TC-E14 — Timer expiry auto-submits
**Precondition:** Exam in progress  
**Steps:**
1. Let timer reach 0:00 (or manually set a short duration for testing)

**Expected:**
- Exam auto-submits at 0:00
- Results shown with whatever was answered
- Banner: "Exam ended: time expired"
- Unanswered questions counted as wrong

---

### TC-E15 — No instant feedback during exam
**Steps:**
1. Select any answer in exam mode

**Expected:**
- No green/red colour on options
- No explanation text shown
- Option shows as selected (subtle highlight only)
- No correct/wrong indicator until results screen

---

### TC-E16 — Results show full review (exam mode)
**Precondition:** Exam submitted  
**Steps:**
1. Complete and submit exam

**Expected:**
- Score circle with pass/fail
- Stats: correct, wrong, flagged, unanswered, time taken
- Violation count shown if > 0
- Full question review: all 20 questions with correct answers and explanations
- Flagged questions marked in review
- "Retake Exam" button (clears checkpoint, restarts)
- "Switch to Practice" link (→ /quiz/devops-cicd)

---

### TC-E17 — Exam localStorage checkpoint
**Steps:**
1. Start exam, answer 10 questions, flag 2
2. Refresh page

**Expected:**
- Exam resumes at same question
- Answered questions retained
- Flagged questions retained
- Violation count retained
- Timer resumes from checkpoint
- Resume banner shown

---

### TC-E18 — Supabase save on exam completion
**Precondition:** Signed in with Google  
**Steps:**
1. Complete exam
2. Check Supabase → quiz_attempts

**Expected:**
- Row has: user_id, bank_slug, score, total, percentage, passed
- Also has: violation_count, auto_submitted, mode='exam'
- Upserted — no duplicate rows

---

### TC-E19 — Practice mode unaffected
**Steps:**
1. Open `/quiz/devops-cicd`

**Expected:**
- Instant feedback still works
- No side panel (dots only)
- No fullscreen request
- No flag option
- Back navigation not available
- All TC-01 to TC-15 from v1.1 still pass

---

### TC-E20 — Mobile exam experience
**Precondition:** Mobile device  
**Steps:**
1. Open `/exam/devops-cicd` on mobile

**Expected:**
- Side panel collapses to a bottom drawer or hamburger toggle
- Fullscreen requested (mobile browser behaviour)
- Tab switch detection still works
- All touch interactions work correctly

---

## PASS CRITERIA

| Priority | Cases | Required before deploy |
|----------|-------|----------------------|
| P0 — Critical | TC-E04, TC-E05, TC-E09, TC-E11, TC-E15, TC-E16, TC-E19 | Yes |
| P1 — High | TC-E01, TC-E02, TC-E06, TC-E07, TC-E08, TC-E14, TC-E17, TC-E18 | Yes |
| P2 — Medium | TC-E03, TC-E10, TC-E12, TC-E13, TC-E20 | Preferred |
| P3 — Low | TC-E18 (Supabase) | Manual verify |

---

## SCHEMA CHANGES NEEDED

Add columns to `quiz_attempts` before implementing:

```sql
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'practice',
  ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_questions JSONB DEFAULT '[]';
```

---

## DEFECT LOG

| TC | Status | Notes |
|----|--------|-------|
| TC-E01 | — | |
| TC-E02 | — | |
| TC-E03 | — | |
| TC-E04 | — | |
| TC-E05 | — | |
| TC-E06 | — | |
| TC-E07 | — | |
| TC-E08 | — | |
| TC-E09 | — | |
| TC-E10 | — | |
| TC-E11 | — | |
| TC-E12 | — | |
| TC-E13 | — | |
| TC-E14 | — | |
| TC-E15 | — | |
| TC-E16 | — | |
| TC-E17 | — | |
| TC-E18 | — | |
| TC-E19 | — | |
| TC-E20 | — | |
