# QuizOps — Enterprise Roadmap
# GitHub Project Structure
# Copy each section into GitHub exactly as written

---

## LABELS TO CREATE FIRST

Run these in order in GitHub → Labels → New label:

| Label | Color | Description |
|-------|-------|-------------|
| `milestone-1` | #3E7BFA | Enterprise Foundation |
| `milestone-2` | #F97316 | Growth & Monetisation |
| `milestone-3` | #8B5CF6 | Enterprise Features |
| `milestone-4` | #10B981 | Scale |
| `p0` | #EF4444 | Launch blocker |
| `p1` | #F59E0B | High priority |
| `p2` | #6B7280 | Nice to have |
| `frontend` | #14B8A6 | UI/UX work |
| `backend` | #3B82F6 | Server/API work |
| `database` | #0EA5E9 | Schema/migration |
| `content` | #84CC16 | Copy/docs/legal |
| `marketing` | #EC4899 | Growth/GTM |
| `security` | #DC2626 | Security work |
| `ai` | #A855F7 | AI/Claude integration |
| `enterprise` | #F59E0B | Enterprise-specific |
| `bug` | #DC2626 | Bug fix |
| `chore` | #6B7280 | Maintenance |

---

## MILESTONES

Create these four milestones in GitHub → Milestones:

### Milestone 1 — Enterprise Foundation
**Due:** 3 weeks from today
**Description:** Everything needed before the 
first enterprise conversation. Legal, trust, 
UI, pricing, content moderation. No enterprise 
buyer will talk to us without these.
**Goal:** Be able to send quiz.autoshiftops.com 
to a DevRel VP without embarrassment.

### Milestone 2 — Growth & Monetisation  
**Due:** 6 weeks from today
**Description:** Stripe integration, GA4 events, 
first publisher outreach, Pro tier live. 
**Goal:** First paying customer (any tier).
This triggers the Claude API switch.

### Milestone 3 — Enterprise Features
**Due:** 10 weeks from today
**Description:** Team seats, custom domain, 
analytics export, white-label basics.
**Goal:** First enterprise pilot ($299+/month).

### Milestone 4 — Scale
**Due:** 16 weeks from today
**Description:** SSO, LMS integration, 
certificates, API access.
**Goal:** 3 enterprise customers, $1K MRR.

---

## MILESTONE 1 ISSUES — Enterprise Foundation
### (P0 — all must ship before any outreach)

---

### ISSUE M1-01 — UI Revamp: Option C Enterprise Light
**Label:** `milestone-1` `p0` `frontend`
**Milestone:** Enterprise Foundation

**Description:**
Revamp the entire site UI to Option C — 
Clean Enterprise Light theme. Light background, 
professional feel, trustworthy for B2B buyers.

**Scope:**

Homepage (signed out):
- White/light grey background (#FAFAFA / #F4F4F5)
- Blue accent #3E7BFA stays
- New hero: "Quiz your readers. Prove your 
  content works."
- Trust signals below hero:
  "✓ AI-generated in 60s · ✓ No code needed 
   · ✓ Free to start"
- Quiz bank cards: white with subtle shadow,
  light borders (#E4E4E7)
- CTA: "Start for free" + "See how it works"

Homepage (signed in):
- Welcome bar: light blue tint background
- Mini stats: white cards with shadows
- Same personalisation from current build
  but in light theme
- Publisher strip: light blue info panel

Dashboard:
- White background
- Cards with box shadows
- Tier badge in blue (not amber)
- Stats row: white cards

Quiz/Exam pages:
- Keep dark background for focus/exam feel
  (intentional contrast with light marketing pages)
- Only marketing pages go light

NavBar:
- White background, bottom border
- Single dashboard link (NavBar only)
- Remove ALL redundant dashboard links

**Acceptance criteria:**
- [ ] Homepage light theme implemented
- [ ] Dashboard light theme implemented
- [ ] Quiz/exam pages remain dark (intentional)
- [ ] Zero redundant navigation links
- [ ] Mobile responsive
- [ ] npm run build passes

---

### ISSUE M1-02 — Legal: ToS + Privacy Policy pages
**Label:** `milestone-1` `p0` `content` `legal`
**Milestone:** Enterprise Foundation

**Description:**
No enterprise buyer will proceed without 
legal pages. This is a hard blocker for 
any B2B conversation.

**Steps:**
1. Generate ToS and Privacy Policy using 
   Termly (termly.io) or Iubenda (~$10/month)
   Include: data collection, AI usage disclosure,
   cookie policy, GDPR compliance, user rights
2. Create app/legal/terms/page.tsx
3. Create app/legal/privacy/page.tsx
4. Add footer to all pages:
   "© 2025 QuizOps · Terms · Privacy · Security"
5. Footer links to all three pages

**Content to include in ToS:**
- What data is collected (quiz attempts, scores)
- How AI is used (OpenAI for generation, 
  content sent to OpenAI API)
- Publisher responsibilities (appropriate content)
- Content moderation policy
- Acceptable use (no adult, illegal content)

**Acceptance criteria:**
- [ ] /legal/terms loads
- [ ] /legal/privacy loads
- [ ] Footer on every page with links
- [ ] GDPR data deletion mentioned
- [ ] AI usage disclosed (OpenAI)
- [ ] Publisher content policy stated

---

### ISSUE M1-03 — Pricing page
**Label:** `milestone-1` `p0` `frontend` `content`
**Milestone:** Enterprise Foundation

**Description:**
Every enterprise buyer looks for a pricing 
page. No pricing page = not a real product 
in their mind. "Contact us" on Enterprise 
tier is the lead generation mechanism.

**URL:** /pricing

**Three tiers:**

Free:
  Price: $0 forever
  - 3 published quizzes
  - AI generation (GPT-4o mini)
  - Basic analytics (7 days)
  - "Powered by QuizOps" branding
  - Community quiz banks
  - [Start for free →]

Pro — $9/month:
  Price: $9/month (billed monthly)
         $7/month (billed annually — save 22%)
  Most popular badge
  Everything in Free, plus:
  - Unlimited quizzes
  - Full analytics history
  - Remove QuizOps branding
  - iFrame embed support
  - Priority support
  - [Start Pro trial →] (links to /waitlist 
    for now — Stripe not built yet)

Enterprise — Custom:
  Price: Custom pricing
  Perfect for teams, platforms, publications
  Everything in Pro, plus:
  - Team seats (unlimited authors)
  - Custom domain (quiz.yourcompany.com)
  - White-label (your logo, your brand)
  - SSO (Okta, Azure AD, Google Workspace)
  - Analytics export (CSV, API)
  - SLA: 99.9% uptime
  - Dedicated onboarding
  - Priority feature requests
  - Annual invoicing / PO accepted
  [Contact us →] → mailto:admin@autoshiftops.com
  or a simple Tally form

**FAQ section below tiers:**
Q: Can I try Pro before paying?
A: Pro waitlist is open — be first when we launch.
Q: What AI model generates questions?
A: GPT-4o mini for Free/Pro. Enterprise gets 
   Claude (Anthropic) for higher quality.
Q: Is my article content stored?
A: Article text is sent to OpenAI for generation 
   only — not stored by QuizOps.
Q: Do you offer educational discounts?
A: Yes — contact us for non-profit and 
   educational institution pricing.

**Acceptance criteria:**
- [ ] /pricing loads and is mobile responsive
- [ ] Three tiers clearly differentiated
- [ ] Enterprise CTA sends email or opens form
- [ ] FAQ section present
- [ ] Link in NavBar: "Pricing"
- [ ] Annual/monthly toggle (UI only, no Stripe)

---

### ISSUE M1-04 — Content moderation in /api/generate
**Label:** `milestone-1` `p0` `backend` `ai` `security`
**Milestone:** Enterprise Foundation

**Description:**
Before opening to public publishers, the AI 
generation must reject inappropriate content.
Enterprise buyers will ask "what stops someone 
from abusing this?"

**Two-layer approach:**

Layer 1 — Domain intent check (before fetch):
Before fetching any URL, send to OpenAI:
"Is this URL likely to contain adult content, 
gambling, hate speech, violence, or illegal 
material? Domain: {domain}
Reply ONLY: {allowed: true} or 
{allowed: false, reason: '...'}"

If not allowed → return 422:
{
  error: 'content_not_allowed',
  message: 'This content is not eligible for 
  quiz generation on QuizOps.',
  reason: 'Adult content detected'
}

Layer 2 — Content classification (after fetch):
After extracting article text, before generating:
"Is the following content appropriate for 
educational quiz generation? It must be 
informational, technical, or educational.
Reply ONLY: {appropriate: true} or 
{appropriate: false, reason: '...'}"

If not appropriate → return 422 with reason.

User-facing message on blocked content:
"This content isn't eligible for quiz generation.
[reason]
QuizOps supports educational and technical 
content only. If you believe this is an error, 
contact support."

**Allowed content types:**
Technical articles, tutorials, documentation,
research papers, educational content, news,
business/professional content.

**Blocked content types:**
Adult/explicit, gambling, hate speech, 
violence/gore, illegal activity instructions,
spam/SEO junk, misinformation.

**Acceptance criteria:**
- [ ] Adult content URLs blocked before fetch
- [ ] Inappropriate fetched content blocked
- [ ] Clear user-facing error message
- [ ] Reason shown to user
- [ ] Legitimate technical content passes
- [ ] Test: autoshiftops.com article → allowed
- [ ] Test: known adult domain → blocked
- [ ] No OPENAI_API_KEY exposed in error

---

### ISSUE M1-05 — Security + About pages
**Label:** `milestone-1` `p0` `frontend` `content` `security`
**Milestone:** Enterprise Foundation

**Description:**
Enterprise buyers check for a security page.
About page establishes credibility and human 
connection.

**Security page (/security):**
Render SECURITY.md content as a proper page.
Sections:
- Our security approach
- Infrastructure (Vercel, Supabase)
- Data handling (what we store, what we don't)
- AI provider disclosure (OpenAI)
- Known open issues (Next.js CVEs — honest)
- Responsible disclosure email
- Link to full SECURITY.md on GitHub

**About page (/about):**
Keep it short and human.
- "QuizOps is built by Sudhakar Sajja, 
  an Application Architect at TechMahindra 
  in Mississauga, Canada."
- Why it was built: "I publish technical 
  articles on AutoShiftOps. I had no way 
  to know if readers actually understood 
  them. So I built QuizOps."
- Link to autoshiftops.com
- Link to GitHub (public repo)
- Contact: admin@autoshiftops.com

**Acceptance criteria:**
- [ ] /security page live
- [ ] /about page live
- [ ] Both linked in footer
- [ ] Honest about current security posture
- [ ] Human, not corporate, tone on About

---

### ISSUE M1-06 — GA4 + custom event tracking
**Label:** `milestone-1` `p0` `frontend` `marketing`
**Milestone:** Enterprise Foundation

**Description:**
We need data to make product decisions and 
to show enterprise buyers proof of traction.
No analytics = flying blind.

**Setup:**
1. Create GA4 property at analytics.google.com
2. Add GA4 measurement ID to Vercel env vars:
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
3. Add GA4 script to app/layout.tsx

**Custom events to track:**

Publisher funnel:
- quiz_create_started — clicked Create quiz
- quiz_generation_started — clicked Generate
- quiz_generation_completed — all Qs streamed
- quiz_generation_failed — stream errored
- quiz_published — quiz went live
- quiz_creation_abandoned — left before publish
- content_blocked — moderation triggered

Reader funnel:
- quiz_started — opened a quiz
- quiz_question_answered — answered a question
- quiz_completed — submitted answers
- quiz_passed — score >= pass mark
- quiz_failed — score < pass mark
- quiz_shared — clicked share button

Monetisation signals:
- upgrade_prompt_shown — hit free tier limit
- upgrade_clicked — clicked upgrade CTA
- pricing_page_viewed — /pricing visited
- enterprise_contact_clicked — contact us clicked

**Implementation:**
Create lib/analytics.ts:
export function track(event: string, 
  params?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  if (!window.gtag) return;
  window.gtag('event', event, params);
}

Use throughout components:
import { track } from '@/lib/analytics';
track('quiz_published', { bank_slug: slug });

**Acceptance criteria:**
- [ ] GA4 script loads on all pages
- [ ] No tracking for signed-out users 
      without cookie consent
- [ ] All publisher funnel events firing
- [ ] All reader funnel events firing
- [ ] Upgrade events firing
- [ ] Verified in GA4 DebugView

---

### ISSUE M1-07 — Error monitoring (Sentry)
**Label:** `milestone-1` `p1` `backend` `frontend`
**Milestone:** Enterprise Foundation

**Description:**
We need to know when things break in 
production before users tell us.
The write-side bug (410c318) went undetected 
for weeks. Sentry would have caught it 
on the first occurrence.

**Setup:**
1. Create free Sentry account at sentry.io
2. npm install @sentry/nextjs
3. npx @sentry/wizard@latest -i nextjs
4. Add to Vercel env vars:
   SENTRY_DSN=https://xxx@sentry.io/xxx
5. Configure in sentry.client.config.ts and 
   sentry.server.config.ts

**What to capture:**
- All unhandled errors (automatic)
- Supabase write failures (manual):
  In every error check added in 38fc43b:
  import * as Sentry from '@sentry/nextjs';
  Sentry.captureException(error, {
    tags: { operation: 'saveQuizAttempt' }
  });
- API route errors
- Generation stream failures

**Acceptance criteria:**
- [ ] Sentry initialised on client and server
- [ ] Test error appears in Sentry dashboard
- [ ] Supabase write errors captured
- [ ] Source maps uploaded for readable stacks
- [ ] Alert set up for new issues (email)

---

### ISSUE M1-08 — Uptime monitoring
**Label:** `milestone-1` `p1` `chore`
**Milestone:** Enterprise Foundation

**Description:**
Enterprise buyers ask about uptime. 
UptimeRobot free tier monitors 5 URLs 
every 5 minutes and emails on downtime.

**Setup (5 minutes, free):**
1. Create account at uptimerobot.com
2. Add monitors for:
   - https://quiz.autoshiftops.com (homepage)
   - https://quiz.autoshiftops.com/api/config
   - https://quiz.autoshiftops.com/quiz/devops-cicd
3. Set alert email: admin@autoshiftops.com
4. Create public status page on UptimeRobot
5. Link status page from /security page

**Acceptance criteria:**
- [ ] 3 monitors active
- [ ] Alert email configured
- [ ] Public status page live
- [ ] Status page linked from /security

---

## MILESTONE 2 ISSUES — Growth & Monetisation

---

### ISSUE M2-01 — Stripe integration + Pro tier
**Label:** `milestone-2` `p0` `backend` `frontend`
**Milestone:** Growth & Monetisation

**Description:**
Stripe subscription billing for Pro tier 
at $9/month. This is the revenue trigger 
and the Claude API switch trigger.

**Implementation:**
- Stripe Checkout for subscription creation
- Webhook to update publishers.tier on payment
- Stripe Customer Portal for self-service
- Pro tier enforcement already in place —
  just needs tier='pro' set in DB

**Note:** Do not build until /waitlist has 
3+ signups. Validate demand first.

---

### ISSUE M2-02 — Pro waitlist page
**Label:** `milestone-2` `p0` `frontend` `marketing`
**Milestone:** Growth & Monetisation

**Description:**
Before Stripe is built, collect Pro tier 
interest via a waitlist. Validates demand 
before engineering investment.

**URL:** /waitlist

Simple page:
- "Pro tier is coming"
- Feature list (same as pricing page)
- Email input → saves to Supabase waitlist table
- "We'll notify you when Pro launches"
- Counter: "X publishers already on the waitlist"

---

### ISSUE M2-03 — Publisher outreach campaign
**Label:** `milestone-2` `p0` `marketing`
**Milestone:** Growth & Monetisation

**Description:**
First 10 publishers. Personal outreach only —
no ads, no cold email blasts.

**Target list (build this):**
1. autoshiftops.com (Sajja — already using)
2. 5 DevRel writers from companies you know
3. 3 active dev.to/Hashnode writers in 
   DevOps/Cloud space
4. 1 tech publication (InfoQ, DZone contact)

**Outreach message:**
"I built a tool that lets technical writers 
add a comprehension quiz to any article in 
60 seconds — AI generates the questions from 
your article URL. I use it myself on 
autoshiftops.com. Would you try it with 
one article? Free, no credit card."

**Success metric:** 
3 external publishers with at least 1 
published quiz each.

---

### ISSUE M2-04 — LinkedIn launch post
**Label:** `milestone-2` `p0` `marketing`
**Milestone:** Growth & Monetisation

**Description:**
One well-crafted LinkedIn post announcing 
QuizOps to your network.

**Angle:**
"I publish 66+ technical articles. I had 
no idea if readers actually understood them.
So I built a tool to find out.

Introducing QuizOps — paste your article URL, 
get 10 quiz questions in 60 seconds, share 
with your readers.

First result: 1 reader took my Terraform quiz 
this week. 100% pass rate. That told me more 
about my writing than 500 views ever did.

Free to start: quiz.autoshiftops.com"

**Success metric:**
500+ impressions, 5+ DMs asking to try it.

---

## MILESTONE 3 ISSUES — Enterprise Features
### (Build only after first paying customer)

---

### ISSUE M3-01 — Team seats
**Label:** `milestone-3` `p1` `backend` `enterprise`
**Milestone:** Enterprise Features

Multiple publishers under one organisation.
Admin/author/viewer roles.
Shared quiz library within organisation.

---

### ISSUE M3-02 — Custom domain support
**Label:** `milestone-3` `p1` `enterprise`
**Milestone:** Enterprise Features

quiz.theircompany.com pointing to QuizOps.
Vercel's domain API or subdomain routing.

---

### ISSUE M3-03 — White-label branding
**Label:** `milestone-3` `p1` `frontend` `enterprise`
**Milestone:** Enterprise Features

Replace QuizOps logo/name with customer's 
brand on public quiz pages.
Remove all QuizOps attribution.

---

### ISSUE M3-04 — Analytics export
**Label:** `milestone-3` `p2` `backend` `enterprise`
**Milestone:** Enterprise Features

CSV export of all attempt data per quiz.
Date range filter.
API endpoint for BI tool integration.

---

### ISSUE M3-05 — iFrame embed + React component
**Label:** `milestone-3` `p2` `frontend` `enterprise`
**Milestone:** Enterprise Features

Embeddable quiz widget for any website.
<iframe src="quiz.autoshiftops.com/embed/slug">
Also publish @quizops/react npm package.

---

## MILESTONE 4 ISSUES — Scale
### (Build after 3 enterprise customers)

---

### ISSUE M4-01 — SSO (SAML / Okta / Azure AD)
**Label:** `milestone-4` `p1` `backend` `enterprise`

### ISSUE M4-02 — Completion certificates
**Label:** `milestone-4` `p2` `frontend` `enterprise`

### ISSUE M4-03 — LMS integration (SCORM/xAPI)
**Label:** `milestone-4` `p2` `backend` `enterprise`

### ISSUE M4-04 — Public API
**Label:** `milestone-4` `p2` `backend` `enterprise`

### ISSUE M4-05 — Switch to Claude API (Anthropic)
**Label:** `milestone-4` `p0` `ai`
**Trigger:** First paid customer (any tier)
**Note:** This is Sajja's commitment — 
switch AI_PROVIDER=anthropic, 
AI_MODEL=claude-haiku-4-5-20251001
upon first revenue.

---

## SUMMARY

| Milestone | Issues | Goal | Timeline |
|-----------|--------|------|----------|
| 1 — Foundation | M1-01 to M1-08 | Enterprise-ready to show | Week 1-3 |
| 2 — Growth | M2-01 to M2-04 | First paying customer | Week 4-6 |
| 3 — Enterprise | M3-01 to M3-05 | First enterprise pilot | Week 7-10 |
| 4 — Scale | M4-01 to M4-05 | 3 enterprise customers | Week 11-16 |

**Critical path to first customer:**
M1-01 (UI) → M1-02 (Legal) → M1-03 (Pricing) 
→ M1-04 (Moderation) → M2-02 (Waitlist) 
→ M2-04 (LinkedIn post) → M2-03 (Outreach)
→ First customer → M4-05 (Claude switch) 🎯
