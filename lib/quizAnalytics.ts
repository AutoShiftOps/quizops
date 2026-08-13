import { supabaseAdmin } from './supabaseAdmin';
import { Question } from './types';

// Server-only — every function here uses supabaseAdmin (service role,
// bypasses RLS). Safe to call only after the caller has already verified
// the requesting user owns quizId/publisherId (see
// app/api/quiz/[id]/analytics/route.ts, which does that check via the
// normal RLS-scoped client before ever touching this file).

export async function getQuizAnalytics(
  quizId: string,
  publisherId: string,
  days: number = 30
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // All attempts for this quiz
  const { data: attempts, error } =
    await supabaseAdmin
      .from('published_quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('publisher_id', publisherId)
      .gte('attempted_at', since.toISOString())
      .order('attempted_at', { ascending: false });

  if (error || !attempts) return null;

  const total = attempts.length;
  const passed = attempts.filter(
    (a) => a.passed
  ).length;
  const passRate = total > 0
    ? Math.round((passed / total) * 100)
    : 0;
  const avgScore = total > 0
    ? Math.round(
        attempts.reduce(
          (sum, a) => sum + a.percentage, 0
        ) / total
      )
    : 0;
  const avgTime = total > 0
    ? Math.round(
        attempts.reduce(
          (sum, a) => sum + (a.time_taken_s || 0), 0
        ) / total
      )
    : 0;

  // Per-question performance from answers JSONB
  // answers shape: { "q1": 2, "q2": 0, ... }
  // where value is the index chosen (0-3)

  return {
    total,
    passed,
    passRate,
    avgScore,
    avgTime,
    attempts,
  };
}

export async function getQuestionPerformance(
  quizId: string,
  publisherId: string,
  questions: Question[],
  days: number = 30
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: attempts } = await supabaseAdmin
    .from('published_quiz_attempts')
    .select('answers, score, total')
    .eq('quiz_id', quizId)
    .eq('publisher_id', publisherId)
    .gte('attempted_at', since.toISOString());

  if (!attempts || attempts.length === 0)
    return [];

  // For each question calculate pass rate
  return questions.map((q, index) => {
    const qKey = q.id || `q${index + 1}`;
    let correct = 0;
    let seen = 0;

    attempts.forEach((attempt) => {
      if (!attempt.answers) return;
      const chosen = attempt.answers[qKey];
      if (chosen === undefined) return;
      seen++;
      if (chosen === q.answer) correct++;
    });

    const rate = seen > 0
      ? Math.round((correct / seen) * 100)
      : null;

    return {
      id: qKey,
      index: index + 1,
      text: q.text,
      correctRate: rate,
      seen,
      needsAttention: rate !== null && rate < 50,
    };
  }).sort((a, b) =>
    (a.correctRate ?? 100) - (b.correctRate ?? 100)
  );
}

export async function getAttemptsOverTime(
  quizId: string,
  publisherId: string,
  days: number = 30
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: attempts } = await supabaseAdmin
    .from('published_quiz_attempts')
    .select('attempted_at, passed, percentage')
    .eq('quiz_id', quizId)
    .eq('publisher_id', publisherId)
    .gte('attempted_at', since.toISOString())
    .order('attempted_at', { ascending: true });

  if (!attempts) return [];

  // Group by date
  const grouped: Record<string, {
    date: string;
    count: number;
    passed: number;
  }> = {};

  attempts.forEach((a) => {
    const date = new Date(a.attempted_at)
      .toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      });
    if (!grouped[date]) {
      grouped[date] = { date, count: 0, passed: 0 };
    }
    grouped[date].count++;
    if (a.passed) grouped[date].passed++;
  });

  return Object.values(grouped);
}
