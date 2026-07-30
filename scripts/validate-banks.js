const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const REQUIRED_BANK_FIELDS = [
  'slug',
  'name',
  'description',
  'topic',
  'emoji',
  'source_url',
  'duration_seconds',
  'pass_mark',
  'question_count',
];

function fail(bankName, message) {
  console.error(`  ✗ ${bankName}: ${message}`);
  return false;
}

function validateBank(bankDir) {
  const bankName = path.basename(bankDir);
  let ok = true;

  const bankJsonPath = path.join(bankDir, 'bank.json');
  const questionsJsonPath = path.join(bankDir, 'questions.json');

  if (!fs.existsSync(bankJsonPath)) {
    return fail(bankName, 'missing bank.json');
  }
  if (!fs.existsSync(questionsJsonPath)) {
    return fail(bankName, 'missing questions.json');
  }

  let bank;
  try {
    bank = JSON.parse(fs.readFileSync(bankJsonPath, 'utf-8'));
  } catch (err) {
    return fail(bankName, `bank.json is not valid JSON (${err.message})`);
  }

  for (const field of REQUIRED_BANK_FIELDS) {
    if (!(field in bank)) {
      ok = fail(bankName, `bank.json is missing required field "${field}"`) && ok;
    }
  }

  let questions;
  try {
    questions = JSON.parse(fs.readFileSync(questionsJsonPath, 'utf-8'));
  } catch (err) {
    return fail(bankName, `questions.json is not valid JSON (${err.message})`);
  }

  if (!Array.isArray(questions)) {
    return fail(bankName, 'questions.json must be an array');
  }

  if (questions.length < 10) {
    ok = fail(bankName, `must have at least 10 questions (found ${questions.length})`) && ok;
  }

  questions.forEach((q, i) => {
    const label = `question[${i}]${q && q.id ? ` (${q.id})` : ''}`;

    if (!q.id) ok = fail(bankName, `${label}: missing "id"`) && ok;
    if (!q.text) ok = fail(bankName, `${label}: missing "text"`) && ok;

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      ok = fail(bankName, `${label}: "options" must be an array of exactly 4 items`) && ok;
    }

    if (
      typeof q.answer !== 'number' ||
      q.answer < 0 ||
      q.answer > 3 ||
      !Number.isInteger(q.answer)
    ) {
      ok = fail(bankName, `${label}: "answer" must be an integer between 0 and 3`) && ok;
    }

    if (!q.explanation) {
      ok = fail(bankName, `${label}: missing "explanation"`) && ok;
    }
  });

  if (ok) {
    console.log(`  ✓ ${bankName}: ${questions.length} questions valid`);
  }

  return ok;
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('No /content directory found.');
    process.exit(1);
  }

  const bankDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '_template')
    .map((entry) => path.join(CONTENT_DIR, entry.name));

  if (bankDirs.length === 0) {
    console.error('No quiz banks found in /content.');
    process.exit(1);
  }

  console.log(`Validating ${bankDirs.length} quiz bank(s)...\n`);

  let allOk = true;
  for (const bankDir of bankDirs) {
    allOk = validateBank(bankDir) && allOk;
  }

  console.log('');
  if (!allOk) {
    console.error('Validation failed.');
    process.exit(1);
  }

  console.log('All quiz banks are valid.');
}

main();
