# QuizOps

Open-source quiz engine for technical content creators and learners.

## Live site
**https://quiz.autoshiftops.com**

---

## What is QuizOps?

QuizOps lets technical writers turn their articles into interactive quizzes — in under 60 seconds, powered by AI.

**For publishers:** Paste your article URL → AI generates questions → share a quiz link with your readers.

**For readers:** Test your understanding of technical articles, DevOps concepts, cloud certifications, and engineering fundamentals.

---

## Features

### For Publishers
- **AI question generation** — paste an article URL, get 10 questions in under 60 seconds
- **Editable question review** — edit, delete, reorder before publishing
- **Instant share** — get a link, embed HTML, and badge for your article
- **Analytics dashboard** — see attempt counts, pass rates, and most-missed questions
- **Free tier** — 3 published quizzes, no credit card required

### For Readers
- **Practice mode** — instant feedback after each answer with explanations
- **Exam mode** — proctored feel, side panel navigation, flag questions, no feedback until submission
- **Progress tracking** — sign in with Google to track scores across sessions
- **Guest mode** — no account needed to take a quiz

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth + DB | Supabase (Google OAuth) |
| AI | OpenAI (gpt-4o-mini) |
| Hosting | Vercel |
| Domain | quiz.autoshiftops.com |

---

## Project Structure

```
quizops/
├── app/
│   ├── page.tsx                      ← Homepage — quiz bank grid
│   ├── quiz/[slug]/page.tsx          ← Practice mode
│   ├── exam/[slug]/page.tsx          ← Exam mode (proctored)
│   ├── dashboard/
│   │   ├── page.tsx                  ← Publisher dashboard
│   │   ├── new/page.tsx              ← Create quiz with AI
│   │   └── quiz/[id]/
│   │       ├── page.tsx              ← Edit quiz
│   │       └── analytics/page.tsx   ← Quiz analytics
│   ├── q/
│   │   ├── [username]/page.tsx       ← Publisher profile
│   │   └── [username]/[slug]/page.tsx ← Public reader quiz page
│   └── api/
│       ├── config/route.ts           ← Supabase env vars
│       ├── generate/route.ts         ← AI question generation
│       ├── publish/route.ts          ← Publish quiz
│       └── badge/[username]/[slug]/route.ts ← SVG badge
├── components/
│   ├── NavBar.tsx
│   ├── Logo.tsx
│   ├── QuizCard.tsx                  ← Homepage bank card
│   ├── BankGrid.tsx                  ← Homepage grid with scores
│   ├── QuizEngine.tsx                ← Practice quiz UI
│   ├── ExamEngine.tsx                ← Exam mode UI
│   ├── ExamProctor.tsx               ← Fullscreen + tab enforcement
│   ├── ExamStartScreen.tsx
│   ├── ExamResultsScreen.tsx
│   ├── ResultsScreen.tsx
│   ├── LoginButton.tsx
│   ├── PublisherOnboarding.tsx       ← First-time publisher setup
│   ├── PublisherQuizCard.tsx         ← Dashboard quiz card
│   ├── GenerationStream.tsx          ← Streaming AI question UI
│   ├── QuestionEditor.tsx            ← Edit individual questions
│   ├── SharePanel.tsx                ← Post-publish share UI
│   ├── TierBadge.tsx                 ← Free/Pro badge
│   └── AnalyticsCharts.tsx
├── lib/
│   ├── types.ts                      ← Shared TypeScript types
│   ├── supabase.ts                   ← Supabase client + helpers
│   ├── loadBanks.ts                  ← Reads /content/ folder
│   ├── publisher.ts                  ← Publisher DB helpers
│   ├── publishedQuiz.ts              ← Reader quiz helpers
│   ├── quizStorage.ts                ← Practice localStorage
│   └── examStorage.ts                ← Exam localStorage
├── content/                          ← Community quiz banks (JSON)
│   ├── _template/
│   └── devops-cicd/
├── supabase/
│   ├── schema.sql                    ← Full schema (source of truth)
│   └── migrations/
│       ├── 001_initial.sql
│       ├── 002_exam_mode.sql
│       └── 003_publisher_mvp.sql
├── scripts/
│   └── validate-banks.js
├── public/
│   ├── og-image.png
│   ├── og-image.svg
│   └── favicon.svg
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── DEPLOY.md
├── TEST_PLAN.md
├── TEST_PLAN_EXAM_MODE.md
└── GITHUB_ISSUES.md
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `AI_PROVIDER` | Yes (publisher feature) | `openai` (current) or `anthropic` |
| `AI_MODEL` | Yes (publisher feature) | Model name for the selected provider |
| `OPENAI_API_KEY` | Yes (publisher feature) | OpenAI API key for question generation |
| `APP_URL` | Yes | Full URL of this deployment |

> Switch to `ANTHROPIC_API_KEY` when the first paid customer is onboarded —
> see `.env.example` for the provider-swap pattern (no code change needed).

---

## Local Development

```bash
git clone https://github.com/AutoShiftOps/quizops.git
cd quizops
npm install
cp .env.example .env.local
# Edit .env.local with real values
npm run dev
# Opens at http://localhost:3000
```

---

## Database Setup

Run migrations in order in Supabase SQL Editor:

```
supabase/migrations/001_initial.sql
supabase/migrations/002_exam_mode.sql
supabase/migrations/003_publisher_mvp.sql
```

For a fresh install, use `supabase/schema.sql` which contains everything.

---

## Publisher Flow

1. Sign in with Google at `quiz.autoshiftops.com`
2. Visit `/dashboard` → complete one-time username setup
3. Click "Create quiz from article"
4. Paste your article URL
5. Watch questions generate in real time
6. Edit, delete, or add questions
7. Click "Publish"
8. Copy the share link and embed it in your article

---

## Community Quiz Banks

Anyone can contribute a quiz bank without writing code.
See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full Vercel + Supabase + DNS setup.

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Core quiz engine | ✅ Done | Practice + exam modes |
| Auth + progress | ✅ Done | Google OAuth, Supabase |
| Exam proctoring | ✅ Done | Fullscreen, violations, flagging |
| Publisher MVP | 🚧 Building | AI generation, dashboard, public pages |
| Analytics | ⏳ Planned | Charts, weak areas, exports |
| Pro tier + Stripe | ⏳ Planned | Monetisation |
| Embeds + badges | ⏳ Planned | iFrame, SVG badges |
| AI on free tier | ⏳ Planned | 3 generations/month |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — use it, fork it, build on it.

---

Built by [AutoShiftOps](https://autoshiftops.com)
