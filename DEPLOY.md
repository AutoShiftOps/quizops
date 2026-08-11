# QuizOps — Deployment Guide
## Stack: GitHub repo → Vercel (host) · Supabase (auth + DB) · Google OAuth · OpenAI (AI generation)

---

## STEP 1 — Supabase setup

1. Go to https://supabase.com → New project (or reuse the existing shared
   `AutoShiftOps` project if you're collaborating on this one — ask for
   access rather than standing up a duplicate).
2. Wait ~2 min for provisioning.
3. SQL Editor → New query → run the schema. Two ways to get there:
   - **Fresh install** — run `supabase/schema.sql` once. It's the single
     source of truth for all six tables (`quiz_attempts`, `quiz_progress`,
     `publishers`, `published_quizzes`, `published_quiz_attempts`) with
     every index, RLS policy, and trigger in one pass.
   - **Existing project, catching up** — run the migrations in order
     instead:
     ```
     supabase/migrations/001_initial.sql
     supabase/migrations/002_exam_mode.sql
     supabase/migrations/003_publisher_mvp.sql
     ```
     Each one is idempotent (`CREATE TABLE IF NOT EXISTS` /
     `ADD COLUMN IF NOT EXISTS` / `DROP POLICY IF EXISTS`), so re-running
     is safe if you're not sure what's already applied.
4. Authentication → Providers → **Google** → toggle on (you'll paste the
   Client ID/Secret here in Step 2).
5. Settings → API → copy:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public key** → `eyJhbGci...`

---

## STEP 2 — Google OAuth

1. https://console.cloud.google.com → New project (or reuse an existing
   one for the org).
2. APIs & Services → OAuth consent screen → External → fill in the app
   name.
3. APIs & Services → Credentials → Create → OAuth Client ID → Web
   application.
4. **Authorised JavaScript origins** — add every origin you'll actually
   load the app from:
   ```
   http://localhost:3000
   https://quiz.autoshiftops.com
   ```
5. **Authorised redirect URIs** — this is Supabase's callback, not your
   app's URL (swap in your actual project ref from Step 1):
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
6. Copy the **Client ID** and **Client Secret**.
7. Back in Supabase → Authentication → Providers → Google → paste both →
   Save.

---

## STEP 3 — Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `OPENAI_API_KEY` | Yes | OpenAI key for AI generation |
| `AI_PROVIDER` | Yes | Set to: `openai` |
| `AI_MODEL` | Yes | Set to: `gpt-4o-mini` |
| `APP_URL` | Yes | Full URL of this deployment |

> **Note:** When the first paid customer is onboarded, switch
> `AI_PROVIDER=anthropic`, `AI_MODEL=claude-haiku-4-5-20251001`, and
> replace `OPENAI_API_KEY` with `ANTHROPIC_API_KEY`. No code change is
> needed — `app/api/generate/route.ts` reads the provider/model from env
> vars. See `.env.example` for the exact swap.

---

## STEP 4 — Local development

```bash
git clone https://github.com/AutoShiftOps/quizops.git
cd quizops
npm install
cp .env.example .env.local
# edit .env.local with real values
npm run dev
# runs at http://localhost:3000
```

---

## STEP 5 — Vercel deployment

1. https://vercel.com → New Project → Import Git Repository.
2. Select `AutoShiftOps/quizops`.
3. Framework preset: **Next.js** (auto-detected).
4. Settings → Environment Variables → add all 6 variables from Step 3
   (Production + Preview).
5. Deploy.

Your live URL will be something like `https://quizops.vercel.app` until
Step 6's custom domain is attached.

---

## STEP 6 — Custom domain (quiz.autoshiftops.com)

1. Vercel → Project → Settings → Domains → add `quiz.autoshiftops.com`.
2. Copy the CNAME value Vercel gives you.
3. At your domain registrar, add a CNAME record:
   ```
   Name:  quiz
   Value: [the CNAME Vercel gave you]
   ```
4. Supabase → Authentication → URL Configuration → add to Redirect URLs:
   ```
   https://quiz.autoshiftops.com
   https://quiz.autoshiftops.com/**
   ```
5. Google Cloud Console → Credentials → your OAuth Client → Authorised
   JavaScript origins → add:
   ```
   https://quiz.autoshiftops.com
   ```
6. Update `APP_URL` in Vercel's environment variables to
   `https://quiz.autoshiftops.com` and redeploy.

---

## STEP 7 — Smoke test

Full test suite: [LIVE_TEST_PLAN.md](./LIVE_TEST_PLAN.md) (42 tests,
work through LT-01 onward).

Quick sanity checks before a full pass:
- [ ] Homepage loads
- [ ] `/api/config` returns 200
- [ ] Google sign-in redirects back correctly
- [ ] `/dashboard` loads after sign-in
- [ ] Generate a quiz from a real article URL
- [ ] Published quiz is accessible at `/q/[username]/[slug]`

---

## STEP 8 — CI & branch protection

`.github/workflows/e2e.yml` already runs the Playwright suite (`npm test`)
on every push to `main` and every PR targeting `main` — that part needs no
further setup.

### 8a — GitHub branch protection: **already partially live**

As of 2026-08-11, a repo ruleset named **"Protect main"** exists and is
active (GitHub → repo → **Settings → Rules → Rulesets**, not the older
Settings → Branches page — this was created via the newer Rulesets
system). Current live configuration, confirmed via
`gh api repos/AutoShiftOps/quizops/rulesets/20700669`:

- Blocks branch deletion and force-push (non-fast-forward) on `main`.
- Requires the **`test`** status check (the `e2e.yml` job) to pass, with
  the strict "branches must be up to date" policy.
- Does **not** require pull requests — direct `git push origin main` still
  works, same as this project's history so far.
- A bypass actor is configured on the ruleset, so a required-status-check
  failure doesn't block every possible push. Observed live: a commit
  pushed here while `test` was red went through with GitHub explicitly
  logging *"Bypassed rule violations for refs/heads/main: Required status
  check 'test' is expected."*

Net effect right now: contributors without bypass rights are blocked by a
red `test` check; the bypass actor isn't. That's a real, working gate for
everyone else, with an intentional escape hatch — not nothing, but also
not the same guarantee as PR-gating below.

**If you want it to actually stop bad code from reaching `main` for
everyone, including bypass-configured accounts:** the ruleset needs a
`pull_request` rule added (equivalent to "Require a pull request before
merging" in the classic UI) and the bypass actor removed or scoped down.
Required status checks alone — what's live today — only ever block a
*merge*; there's no GitHub mechanism to block a raw `git push` on a check
result, because the check can't run until *after* the commit already
exists. Adding the PR requirement forces every change onto a branch first,
where the check runs *before* merge is allowed — that's the only version
of this that actually keeps `main` clean. It also means the direct-push
loop this project has used throughout its history stops working the
moment "Do not allow bypassing" is set. That trade is worth making
deliberately, not silently — see the closing note below.

### 8b — Vercel

Vercel does not have a simple "wait for GitHub Actions to pass" toggle in
the dashboard — **Settings → Git → Ignored Build Step** is for
conditionally *skipping* a build based on a shell script's exit code (e.g.
"only build if `app/` changed"), not for gating on an external CI job's
result. Two ways to actually get the effect asked for:

1. **Easiest, and what 8a's PR-gating already buys you for free:** if
   `main` is protected such that bad commits can never land on it (8a with
   "Require a pull request before merging"), then Vercel's
   production deployment — which triggers on push to `main` — simply never
   sees failing code in the first place. No separate Vercel configuration
   needed.
2. **If direct pushes to `main` stay allowed:** disable Vercel's automatic
   production deployment on push, and instead deploy from GitHub Actions
   itself, as a step that only runs after the `test` job succeeds (`needs:
   test`), using `vercel deploy --prod --token=$VERCEL_TOKEN`. More setup
   (needs a `VERCEL_TOKEN` secret + `vercel link`), but it's the only path
   that gates deployment on tests *without* requiring PRs.

Exact Vercel UI labels shift between plans/redesigns — verify directly in
the dashboard rather than trusting this section's wording precisely.

### What I did / didn't do here

The "Protect main" ruleset (required `test` check + a bypass actor) was
configured directly in the GitHub UI, not by me. I haven't added the
`pull_request` rule that would close the bypass gap — that's still an open
decision (see above), and a one-way door for the direct-push workflow this
project has used throughout, so I'm not flipping it without being asked to
in so many words. Say so and I'll add it via
`gh api repos/AutoShiftOps/quizops/rulesets/20700669` (PATCH, adding a
`pull_request` rule to the existing ruleset).

---

## DEPLOYMENT STATUS

> README.md's own "status" table (Roadmap) tracks feature phases, not
> infra deployment — it's also stale (still shows Publisher MVP as
> "Building" after #1–7 shipped and closed). This table tracks actual
> deployment/infra state instead.

| Item | Status | Notes |
|------|--------|-------|
| Vercel deployment | ✅ Live | quiz.autoshiftops.com |
| Google OAuth | ✅ Live | Redirect URLs configured |
| Publisher MVP (#1-7) | ✅ Live | e909f65 |
| Dashboard redesign | ✅ Live | c09dc20 |
| Auto-title + Edit | ✅ Live | 144ba96 |
| Dark theme redesign | ✅ Live | Linear/Vercel aesthetic |
| New geometric Q logo | ✅ Live | Enterprise mark |
| Publisher profile /q/[u] | ✅ Live | M3-10 |
| Custom 404 page | ✅ Live | |
| Waitlist modal | ✅ Live | M2-02 |
| Content moderation | ✅ Live | M1-04 |
| E2E CI (GitHub Actions) | ⚠️ Wired, tests failing | `.github/workflows/e2e.yml` — being fixed |
| Branch protection (main) | ⚠️ Partial | Required `test` check live; PR-gating not enabled — see Step 8 |
| Live test (42 tests) | ⏳ In progress | LIVE_TEST_PLAN.md |
| Full regression (LT28-40) | ⏳ Required | Before public launch |

---

## TROUBLESHOOTING

| Symptom | Fix |
|---------|-----|
| `/api/config` returns 500 | Check Vercel env vars |
| Google OAuth redirect fails | Check Supabase redirect URLs + Google origins |
| Generation returns 422 | URL blocked — use paste fallback |
| Generation returns 429 | Rate limit — wait 1 hour (free tier) |
| Quiz page 404 | Check quiz status = published in Supabase |
| Dashboard shows wrong quiz count | Check `publishers.quiz_count` in Supabase |
| Build fails | Run `npm run validate` — check `content/` JSONs |
