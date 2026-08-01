# Contributing to QuizOps

Two ways to contribute — pick whichever fits you.

---

## Option A — Add a Community Quiz Bank (No coding required)

Anyone can add a new quiz bank by contributing JSON files.
No Node.js, no local server, no coding knowledge needed.

### Steps

1. **Fork** this repository on GitHub
2. **Copy** `content/_template/` → `content/your-topic-slug/`
3. **Edit** `bank.json` with your quiz metadata
4. **Edit** `questions.json` with your questions
5. **Open a pull request** — we review within 48 hours

### bank.json fields

```json
{
  "slug": "your-topic-slug",
  "name": "Your Quiz Name",
  "description": "One sentence describing what this tests.",
  "topic": "DevOps",
  "emoji": "🚀",
  "source_url": "https://your-blog.com/your-post",
  "duration_seconds": 1200,
  "pass_mark": 70,
  "question_count": 20
}
```

### questions.json format

```json
[
  {
    "id": "q1",
    "text": "Question text here?",
    "code": null,
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Explanation of why A is correct.",
    "tags": ["topic-tag"]
  }
]
```

### Rules

- Minimum 10 questions per bank
- Exactly 4 options per question
- `answer` is zero-based index (0=A, 1=B, 2=C, 3=D)
- `explanation` required for every question
- `code` is a Python/code snippet string or `null`
- `source_url` should link to your article (can be `null`)
- Run `npm run validate` locally before opening PR

### Validation

```bash
npm install
npm run validate
# Must show: all banks OK
```

---

## Option B — Publish via the Dashboard (No GitHub required)

If you are a writer or content creator, you can publish
quizzes directly through the QuizOps publisher dashboard
without touching GitHub at all.

### Steps

1. Go to `quiz.autoshiftops.com`
2. Sign in with Google
3. Visit `/dashboard` → set up your publisher username
4. Click "Create quiz from article"
5. Paste your article URL
6. AI generates questions — review and edit them
7. Click "Publish"
8. Embed the link in your article

### Free vs Pro

| | Free | Pro |
|--|------|-----|
| Published quizzes | 3 | Unlimited |
| AI generation | ✅ | ✅ |
| Analytics | 7 days | Full history |
| Remove branding | ❌ | ✅ |
| iFrame embed | ❌ | ✅ |

---

## Code Contributions

If you want to contribute to the codebase:

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make changes
4. Run `npm run build` — must pass
5. Run `npm run validate` — must pass
6. Open a PR with a clear description

### Local setup

```bash
git clone https://github.com/AutoShiftOps/quizops.git
cd quizops
npm install
cp .env.example .env.local
# Edit .env.local with:
#   SUPABASE_URL
#   SUPABASE_ANON_KEY
#   ANTHROPIC_API_KEY
#   APP_URL=http://localhost:3000
npm run dev
```

### Commit message format

```
feat: add X
fix: resolve Y
docs: update Z
chore: bump dependency
```

---

## Questions?

Open a GitHub Discussion or reach out via
[autoshiftops.com](https://autoshiftops.com).
