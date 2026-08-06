# QuizOps — Live Production Test Plan
## Pre-launch validation before opening to publishers
## Environment: quiz.autoshiftops.com (production)
## Tester: Sajja (you) + 1 trusted friend for reader tests

---

Deployment complete as of 2026-08-05.
Manual live testing in progress.
Start at LT-01 and work through all 29 tests.

---

## PRE-TEST CHECKLIST (before opening browser)

- [x] Vercel deployment green (no build errors)
- [x] quiz.autoshiftops.com resolves (DNS propagated)
- [x] Vercel env vars set: SUPABASE_URL, SUPABASE_ANON_KEY,
      OPENAI_API_KEY, AI_PROVIDER, AI_MODEL, APP_URL
- [x] Supabase → Authentication → Redirect URLs includes
      https://quiz.autoshiftops.com and 
      https://quiz.autoshiftops.com/**
- [x] Google OAuth origins includes quiz.autoshiftops.com
- [x] All 3 Supabase migrations confirmed run
- [ ] DevTools open throughout (Console + Network tabs)
- [ ] Zero console errors on cold page load

---

## PHASE 1 — Infrastructure (5 min)

### LT-01 — Cold load
Open quiz.autoshiftops.com in incognito.

Pass criteria:
- [ ] Homepage loads in under 3 seconds
- [ ] Logo, hero text, DevOps bank card visible
- [ ] Practice + Take Exam buttons on card
- [ ] No console errors
- [ ] Network: /api/config returns 200 with JSON
- [ ] OPENAI_API_KEY not visible anywhere in Network tab

### LT-02 — SEO and OG tags
Open DevTools → Elements → search for <meta>.

Pass criteria:
- [ ] title tag present and correct
- [ ] og:title, og:description, og:image present
- [ ] og:url = https://quiz.autoshiftops.com
- [ ] Paste URL into LinkedIn post inspector:
      https://www.linkedin.com/post-inspector/
      Confirm OG image renders correctly

### LT-03 — Favicon
Pass criteria:
- [ ] Browser tab shows QuizOps favicon (not blank)
- [ ] Favicon is the blue rounded square icon

---

## PHASE 2 — Auth (10 min)

### LT-04 — Google sign-in (production)
Click sign in, complete Google OAuth.

Pass criteria:
- [ ] Redirects to Google consent screen
- [ ] After consent, redirects back to 
      quiz.autoshiftops.com (not localhost)
- [ ] User avatar/email shows in NavBar
- [ ] No auth errors in console
- [ ] Supabase → Authentication → Users shows your account

### LT-05 — Sign out and back in
Pass criteria:
- [ ] Sign out clears session, shows login button
- [ ] Sign back in works on second attempt
- [ ] Session persists on page refresh

---

## PHASE 3 — Existing quiz flows (regression) (20 min)

### LT-06 — Practice quiz end-to-end
Open /quiz/devops-cicd signed in.

Pass criteria:
- [ ] All 20 questions load
- [ ] Instant feedback after each answer
- [ ] Explanation shown
- [ ] Timer counts down
- [ ] Mid-quiz refresh → resumes from checkpoint (TC-02)
- [ ] Complete → results screen with score
- [ ] Supabase → quiz_attempts has updated row
- [ ] QuizCard on homepage shows updated Practice badge

### LT-07 — Exam mode end-to-end
Open /exam/devops-cicd signed in.

Pass criteria:
- [ ] Start screen shows rules
- [ ] Fullscreen requested on Start
- [ ] Side panel visible with 20 question numbers
- [ ] Can navigate freely between questions
- [ ] Flag/unflag works
- [ ] No instant feedback during exam
- [ ] Submit → review modal if flagged questions exist
- [ ] Results show violation count if any
- [ ] Back to home → exits fullscreen (TC-E02 bug fix)
- [ ] Supabase → quiz_attempts has exam row 
      (mode='exam', separate from practice row)
- [ ] Homepage shows both Practice and Exam badges

### LT-08 — Guest mode (incognito)
Open /quiz/devops-cicd without signing in.

Pass criteria:
- [ ] Quiz loads and works fully
- [ ] No console errors about missing user
- [ ] Score shown on results
- [ ] No Supabase save attempted
- [ ] No "undefined" errors anywhere

---

## PHASE 4 — Publisher onboarding (10 min)

### LT-09 — First-time publisher setup (TC-P01)
Navigate to /dashboard signed in (first time).

Pass criteria:
- [ ] Onboarding modal appears
- [ ] Username validates in real time
- [ ] Invalid: "saj" (too short), "SAJ" (uppercase), 
      "saj_ja" (underscore), "saj--ja" (double hyphen)
- [ ] Valid: "sajja", "sajja-dev", "autoshiftops"
- [ ] Taken username shows "Already taken" instantly
- [ ] Display name required before submit enabled
- [ ] On submit → publisher row in Supabase
- [ ] Redirected to dashboard home

### LT-10 — Dashboard home (TC-P02)
Pass criteria:
- [ ] Shows display name
- [ ] Tier badge: "Free · 0 of 3 quizzes used"
- [ ] "+ Create quiz from article" button visible
- [ ] Empty state shown with CTA
- [ ] No console errors

---

## PHASE 5 — AI Question Generation (30 min)
### (Core publisher flow — most important phase)

### LT-11 — URL fetch: autoshiftops.com post (TC-P03)
Use a real autoshiftops.com article URL.

Pass criteria:
- [ ] Paste URL, click Generate
- [ ] Network: POST /api/generate returns 200
- [ ] Questions stream in one by one (not all at once)
- [ ] Each question appears with fade-in
- [ ] "⟳ Generating Q{n}..." shows while streaming
- [ ] All 10 questions appear
- [ ] No malformed/partial JSON shown
- [ ] OPENAI_API_KEY not visible in Network tab (TC-P20)

### LT-12 — URL fetch: blocked site (TC-P04) ← PENDING
Use a URL that blocks server-side fetches.
Try: medium.com article, substack.com post,
or any Cloudflare-protected site.

Pass criteria:
- [ ] Error shown: "Could not fetch that URL"
- [ ] Paste textarea appears automatically
- [ ] No crash, no unhandled error in console
- [ ] Can paste article text and proceed normally
- [ ] Generation completes from pasted text

### LT-13 — Question quality check
Review all 10 generated questions critically.

Pass criteria:
- [ ] Questions are answerable from the article only
- [ ] Wrong options are plausible (not obviously wrong)
- [ ] Explanations reference article content
- [ ] No duplicate questions
- [ ] JSON structure valid (id, text, options×4, 
      answer 0-3, explanation)
- [ ] Subjective quality: would you use these questions?

### LT-14 — Edit generated questions (TC-P06)
Edit Q1: change text, change correct answer, 
change explanation.

Pass criteria:
- [ ] Inline edit opens cleanly
- [ ] All fields editable
- [ ] Correct answer selector works
- [ ] Save updates the card
- [ ] No page reload

### LT-15 — Delete and add questions (TC-P07)
Delete Q3. Add a manual question.

Pass criteria:
- [ ] Q3 deleted, questions renumbered
- [ ] New blank card appears
- [ ] Can fill in manually
- [ ] Total count updates

### LT-16 — Regenerate (TC-P08) ← PENDING
After generation, click Regenerate.

Pass criteria:
- [ ] Confirm prompt appears
- [ ] On confirm → all questions cleared
- [ ] New generation starts from same source
- [ ] Different set of questions generated
- [ ] No state corruption from previous set

### LT-17 — Publish quiz (TC-P09)
Fill in title, description, click Publish.

Pass criteria:
- [ ] Validation: empty title blocked
- [ ] Validation: < 3 questions blocked
- [ ] Valid quiz → publish succeeds
- [ ] Supabase → published_quizzes has new row
      status='published'
- [ ] publishers.quiz_count incremented to 1
- [ ] Redirected to share screen

### LT-17b — Manual creation (TC-P21 browser test)
On /dashboard/new, select "Write questions manually".

Pass criteria:
- [ ] Path selection cards render, manual card selectable
- [ ] No URL input or streaming shown for manual path
- [ ] No /api/generate call made (check Network tab)
- [ ] Can fill title, source URL, topic
- [ ] Can add 3+ questions, each with 4 options and a
      correct answer marked by clicking it
- [ ] Move up/down buttons reorder questions correctly
- [ ] Publish succeeds → quiz appears at /q/[username]/[slug]

### LT-17c — Save draft + publish draft (TC-P22/23)
From the quiz builder (AI or manual path).

Pass criteria:
- [ ] Save draft with title + 1 question succeeds
- [ ] Dashboard shows quiz with grey Draft badge
- [ ] publishers.quiz_count unchanged after draft save
- [ ] /q/[username]/[slug] returns 404 for the draft
- [ ] Click [Publish] on draft card → badge changes to
      Published
- [ ] publishers.quiz_count increments by 1 on publish
- [ ] /q/[username]/[slug] now accessible

### LT-18 — Share screen (TC-P10)
Pass criteria:
- [ ] Live URL shown and correct
- [ ] Copy link → clipboard has correct URL
- [ ] Copy embed → clipboard has <a> tag
- [ ] Copy badge → clipboard has markdown
- [ ] "View quiz →" opens quiz in new tab
- [ ] Quiz loads correctly in new tab

---

## PHASE 6 — Public reader page (15 min)

### LT-19 — Reader quiz page (TC-P11)
Open the published quiz URL in incognito.

Pass criteria:
- [ ] Publisher attribution shown at top
- [ ] "Read the original article →" link present
- [ ] Quiz loads with correct questions
- [ ] "Powered by QuizOps" shown (free tier)
- [ ] Guest can complete quiz without signing in
- [ ] Results screen shows score
- [ ] "Read the original article →" on results screen
- [ ] Supabase → published_quiz_attempts has new row
      with user_id = null (guest)
- [ ] quiz.attempt_count incremented

### LT-20 — Reader quiz signed in (TC-P12)
Complete same quiz signed in as yourself.

Pass criteria:
- [ ] Supabase → published_quiz_attempts has row
      with your user_id
- [ ] Separate row from guest attempt
- [ ] quiz.attempt_count now = 2

### LT-21 — Unknown slug returns 404 (TC-P18)
Open quiz.autoshiftops.com/q/yourname/fake-slug

Pass criteria:
- [ ] 404 page shown
- [ ] No server error (500)
- [ ] No console crash

---

## PHASE 7 — Free tier limits (10 min)

### LT-22 — Publish 2 more quizzes
Publish quizzes #2 and #3 (can use same content,
different titles).

Pass criteria:
- [ ] Each publishes successfully
- [ ] Dashboard shows "Free · 3 of 3 quizzes used"
- [ ] publishers.quiz_count = 3

### LT-23 — Free tier limit enforced (TC-P13)
Attempt to create a 4th quiz.

Pass criteria:
- [ ] Create button disabled or upgrade wall shown
- [ ] Cannot reach /dashboard/new generation step
- [ ] Clear upgrade message shown
- [ ] No API call made to OpenAI
- [ ] Supabase confirms quiz_count stays at 3

---

## PHASE 8 — Dashboard state (5 min)

### LT-24 — Dashboard with quizzes (TC-P14)
Pass criteria:
- [ ] All 3 published quizzes shown as cards
- [ ] Each card shows attempt count and status
- [ ] [View] opens correct public URL
- [ ] [Share] copies correct URL
- [ ] Tier badge: "Free · 3 of 3 quizzes used"

### LT-25 — Delete a quiz
Click delete on one quiz, confirm.

Pass criteria:
- [ ] Quiz removed from dashboard
- [ ] Supabase → published_quizzes row deleted
- [ ] quiz_count decremented to 2
- [ ] Public URL now returns 404
- [ ] Tier badge: "Free · 2 of 3 quizzes used"

---

## PHASE 9 — Regression final check (10 min)

### LT-26 — All original routes still work (TC-P19)
- [ ] quiz.autoshiftops.com loads
- [ ] /quiz/devops-cicd loads and works
- [ ] /exam/devops-cicd loads and works
- [ ] Practice scores still save to quiz_attempts
- [ ] Exam scores still save with mode='exam'
- [ ] Dual badges still show on homepage

### LT-27 — Mobile smoke test
Open quiz.autoshiftops.com on your phone.
- [ ] Homepage loads correctly
- [ ] Practice quiz works on mobile
- [ ] /dashboard loads and is usable
- [ ] Generate flow works on mobile
- [ ] Share screen copy buttons work

---

## PASS CRITERIA SUMMARY

| Phase | Tests | Required to launch |
|-------|-------|-------------------|
| 1 — Infrastructure | LT-01 to LT-03 | All pass |
| 2 — Auth | LT-04 to LT-05 | All pass |
| 3 — Regression | LT-06 to LT-08 | All pass |
| 4 — Onboarding | LT-09 to LT-10 | All pass |
| 5 — AI Generation | LT-11 to LT-18 | All pass |
| 6 — Reader page | LT-19 to LT-21 | All pass |
| 7 — Tier limits | LT-22 to LT-23 | All pass |
| 8 — Dashboard | LT-24 to LT-25 | All pass |
| 9 — Regression | LT-26 to LT-27 | All pass |

**Total: 29 live tests. All must pass before opening 
to external publishers.**

---

## KNOWN PENDING BEFORE TEST

- [ ] Rotate OpenAI API key (critical — do before deployment)
- [ ] Reset .env.local (APP_URL, remove service-role key)
- [ ] supabase/schema.sql updated with publisher tables
- [ ] Vercel deployment live at quiz.autoshiftops.com

---

## DEFECT LOG

| Test | Status | Notes |
|------|--------|-------|
| LT-01 | — | |
| LT-02 | — | |
| LT-03 | — | |
| LT-04 | — | |
| LT-05 | — | |
| LT-06 | — | Score badges verified working after BankGrid auth fix |
| LT-07 | — | |
| LT-08 | — | |
| LT-09 | — | |
| LT-10 | — | |
| LT-11 | — | |
| LT-12 | — | |
| LT-13 | — | |
| LT-14 | — | |
| LT-15 | — | |
| LT-16 | — | |
| LT-17 | — | |
| LT-17b | — | |
| LT-17c | — | |
| LT-18 | — | |
| LT-19 | — | |
| LT-20 | — | |
| LT-21 | — | |
| LT-22 | — | |
| LT-23 | — | |
| LT-24 | — | |
| LT-25 | — | |
| LT-26 | — | |
| LT-27 | — | |

---

## POST-LAUNCH ACTIONS (after all 29 pass)

1. Update DEPLOY.md deployment status table
2. Close GitHub issues #1–#7 with test results
3. Tweet / LinkedIn post announcing QuizOps publisher beta
4. Add "Become a publisher" CTA on autoshiftops.com
5. Send personal invite to 3–5 trusted writers to try it
6. Monitor Supabase → published_quizzes for first 
   external publish
7. Monitor Vercel → Functions logs for any generation errors
8. Set up a simple uptime monitor 
   (UptimeRobot free tier covers this)
