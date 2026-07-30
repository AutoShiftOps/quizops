# QuizOps

Open-source quiz engine for technical certifications and content-linked
knowledge checks.

## Live site

https://quiz.autoshiftops.com

## Add your own quiz bank

See [CONTRIBUTING.md](./CONTRIBUTING.md) — no coding required.

## Tech stack

Next.js 14 · Tailwind CSS · Supabase · Vercel

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Supabase setup

Run [`supabase/schema.sql`](./supabase/schema.sql) against your Supabase
project to create the `quiz_attempts` and `quiz_progress` tables, then enable
Google as an OAuth provider in **Authentication → Providers**.
