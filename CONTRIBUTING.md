# Contributing a Quiz Bank

Anyone can add a new quiz bank in 4 steps — no coding required.

## Steps

1. Fork this repo
2. Copy `content/_template/` → `content/your-topic-slug/`
3. Fill in `bank.json` and `questions.json` following the template
4. Open a pull request

## Rules

- Minimum 10 questions per bank
- Each question must have exactly 4 options
- `answer` field is 0-based index (0=A, 1=B, 2=C, 3=D)
- `explanation` is required for every question
- `source_url` should link to the post that inspired the quiz (can be `null` if standalone)

## Validation

Run `npm run validate` before opening a PR. This checks all JSON files match the schema.
