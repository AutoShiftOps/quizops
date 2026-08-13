import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSupabase';
import { getPublisher } from '@/lib/publisher';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getQuizAnalytics,
  getQuestionPerformance,
  getAttemptsOverTime,
} from '@/lib/quizAnalytics';
import { PublishedQuiz } from '@/lib/types';

// "All time" maps to a large-but-finite day count rather than a separate
// code path — every lib/quizAnalytics.ts function already takes `days` and
// does `since.setDate(since.getDate() - days)`, so this reuses that as-is.
const ALL_TIME_DAYS = 3650;

function parseDays(raw: string | null): number {
  if (raw === 'all') return ALL_TIME_DAYS;
  const n = Number(raw);
  if (raw === '7' || raw === '30') return n;
  return 30; // default
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authed = await getAuthenticatedUser(req);
  if (!authed) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // RLS-scoped client (not supabaseAdmin) for the ownership check itself —
  // "quizzes: publisher read own" already only returns a row if
  // auth.uid() = publisher_id, same pattern as app/api/quiz/[id]/route.ts.
  const { data: quizRow } = await authed.supabase
    .from('published_quizzes')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  const quiz = quizRow as PublishedQuiz | null;
  if (!quiz || quiz.publisher_id !== authed.user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const publisher = await getPublisher(authed.supabase, authed.user.id);

  const requestedDays = parseDays(req.nextUrl.searchParams.get('days'));
  // Free tier is capped to 7 days of history regardless of what's
  // requested — enforced here, not just hidden in the UI, so a free-tier
  // publisher can't just call ?days=30 directly to bypass the paywall.
  const isFreeTier = !publisher || publisher.tier === 'free';
  const capped = isFreeTier && requestedDays > 7;
  const effectiveDays = capped ? 7 : requestedDays;

  const [analytics, questionPerformance, attemptsOverTime] = await Promise.all([
    getQuizAnalytics(quiz.id, quiz.publisher_id, effectiveDays),
    getQuestionPerformance(quiz.id, quiz.publisher_id, quiz.questions, effectiveDays),
    getAttemptsOverTime(quiz.id, quiz.publisher_id, effectiveDays),
  ]);

  if (!analytics) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  // Recent attempts — last 10, already sorted newest-first by
  // getQuizAnalytics's own query. Enrich with a display name/avatar
  // initial: guest (user_id null) vs signed-in (best-effort email lookup,
  // bounded to at most 10 admin API calls since this list is capped at 10).
  const recent = analytics.attempts.slice(0, 10);
  const userIds = Array.from(
    new Set(recent.map((a) => a.user_id).filter((id): id is string => Boolean(id)))
  );
  const emailById = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        if (data?.user?.email) emailById.set(id, data.user.email);
      } catch (err) {
        console.error('[analytics] getUserById failed:', id, err);
      }
    })
  );

  const recentAttempts = recent.map((a) => ({
    id: a.id,
    isGuest: !a.user_id,
    label: a.user_id ? emailById.get(a.user_id) ?? 'Reader' : 'Guest',
    score: a.score,
    total: a.total,
    percentage: a.percentage,
    passed: a.passed,
    timeTakenS: a.time_taken_s,
    attemptedAt: a.attempted_at,
  }));

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      source_url: quiz.source_url,
      slug: quiz.slug,
      created_at: quiz.created_at,
    },
    publisher: {
      tier: publisher?.tier ?? 'free',
      username: publisher?.username ?? null,
    },
    requestedDays,
    effectiveDays,
    capped,
    analytics: {
      total: analytics.total,
      passed: analytics.passed,
      passRate: analytics.passRate,
      avgScore: analytics.avgScore,
      avgTime: analytics.avgTime,
    },
    questionPerformance,
    attemptsOverTime,
    recentAttempts,
  });
}
