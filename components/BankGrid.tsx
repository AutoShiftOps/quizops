'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { QuizBank } from '@/lib/types';
import QuizCard from './QuizCard';

type Score = { percentage: number; passed: boolean };
type ScoreMap = Record<string, { practice?: Score; exam?: Score }>;

function getFirstName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim().split(' ')[0];
  }
  return user.email?.split('@')[0] ?? 'there';
}

type TopQuiz = { title: string; slug: string; readers: number; passRate: number };
type RecentQuiz = { title: string; slug: string };

export default function BankGrid({ banks }: { banks: QuizBank[] }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [hasPublisherProfile, setHasPublisherProfile] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [publishedCount, setPublishedCount] = useState(0);
  const [scoreMap, setScoreMap] = useState<ScoreMap>({});
  const [quizzesTaken, setQuizzesTaken] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [topQuizThisWeek, setTopQuizThisWeek] = useState<TopQuiz | null>(null);
  const [mostRecentQuiz, setMostRecentQuiz] = useState<RecentQuiz | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSignedInData(
      supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
      u: User
    ) {
      setLoadingUserData(true);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [attemptsResult, publisherResult, weeklyReadersResult, quizzesResult] =
        await Promise.all([
          supabase
            .from('quiz_attempts')
            .select('bank_slug, mode, percentage, passed')
            .eq('user_id', u.id),
          supabase.from('publishers').select('*').eq('id', u.id).maybeSingle(),
          supabase
            .from('published_quiz_attempts')
            .select('quiz_id, passed, attempted_at')
            .eq('publisher_id', u.id)
            .gte('attempted_at', sevenDaysAgo),
          supabase
            .from('published_quizzes')
            .select('id, slug, title, created_at')
            .eq('publisher_id', u.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
        ]);

      if (attemptsResult.error) {
        console.error('[BankGrid] quiz_attempts query failed:', attemptsResult.error);
      }
      if (publisherResult.error) {
        console.error('[BankGrid] publishers query failed:', publisherResult.error);
      }
      if (weeklyReadersResult.error) {
        console.error('[BankGrid] published_quiz_attempts query failed:', weeklyReadersResult.error);
      }
      if (quizzesResult.error) {
        console.error('[BankGrid] published_quizzes query failed:', quizzesResult.error);
      }

      const attempts = attemptsResult.data ?? [];
      const grouped = attempts.reduce<ScoreMap>((acc, row) => {
        if (!acc[row.bank_slug]) acc[row.bank_slug] = {};
        const score = { percentage: row.percentage, passed: row.passed };
        if (row.mode === 'practice') acc[row.bank_slug].practice = score;
        else if (row.mode === 'exam') acc[row.bank_slug].exam = score;
        return acc;
      }, {});

      if (!active) return;
      setScoreMap(grouped);
      setQuizzesTaken(attempts.length);
      setBestScore(attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null);

      const publisher = publisherResult.data;
      setHasPublisherProfile(publisher !== null);
      setUsername(publisher?.username ?? null);
      setPublishedCount(publisher?.quiz_count ?? 0);

      const quizzes = quizzesResult.data ?? [];
      const perQuiz: Record<string, { count: number; passedCount: number }> = {};
      for (const row of weeklyReadersResult.data ?? []) {
        if (!perQuiz[row.quiz_id]) perQuiz[row.quiz_id] = { count: 0, passedCount: 0 };
        perQuiz[row.quiz_id].count += 1;
        if (row.passed) perQuiz[row.quiz_id].passedCount += 1;
      }
      let top: TopQuiz | null = null;
      for (const quiz of quizzes) {
        const stats = perQuiz[quiz.id];
        if (stats && (!top || stats.count > top.readers)) {
          top = {
            title: quiz.title,
            slug: quiz.slug,
            readers: stats.count,
            passRate: Math.round((stats.passedCount / stats.count) * 100),
          };
        }
      }
      setTopQuizThisWeek(top);
      setMostRecentQuiz(quizzes[0] ? { title: quizzes[0].title, slug: quizzes[0].slug } : null);
      setLoadingUserData(false);
    }

    function resetToGuest() {
      setScoreMap({});
      setQuizzesTaken(0);
      setBestScore(null);
      setHasPublisherProfile(false);
      setUsername(null);
      setPublishedCount(0);
      setTopQuizThisWeek(null);
      setMostRecentQuiz(null);
      setLoadingUserData(false);
    }

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setUser(session?.user ?? null);

      if (!session?.user) {
        resetToGuest();
      } else {
        await loadSignedInData(supabase, session.user);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!active) return;
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          loadSignedInData(supabase, newSession.user);
        } else {
          resetToGuest();
        }
      });

      return () => subscription.unsubscribe();
    })().catch((err) => {
      console.error('[BankGrid] init failed:', err);
      if (active) resetToGuest();
    });

    return () => {
      active = false;
    };
  }, []);

  const isSignedIn = Boolean(user);

  return (
    <>
      {isSignedIn && user && (
        <div className="-mx-6 px-6 py-2 mb-10 bg-[#EFF6FF] border-b border-[#BFDBFE]">
          <span className="text-[13px] text-[#1D4ED8]">
            👋 Welcome back, {getFirstName(user)}
          </span>
        </div>
      )}

      <section className="text-center mb-16">
        {!isSignedIn && (
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] mb-5">
            Publisher platform for technical writers
          </span>
        )}

        <h1
          className="font-heading font-extrabold text-[#18181B] mb-4"
          style={{ fontSize: 40, letterSpacing: '-1px', lineHeight: 1.15 }}
        >
          {isSignedIn ? (
            'Test your technical knowledge'
          ) : (
            <>
              Quiz your readers.
              <br />
              Prove your content works.
            </>
          )}
        </h1>

        <p className="text-[#71717A] max-w-[480px] mx-auto">
          {isSignedIn
            ? 'Pick up where you left off, or explore a new topic.'
            : 'Paste your article URL. Get 10 quiz questions in 60 seconds. See how many readers actually understood what you wrote.'}
        </p>

        {!isSignedIn && (
          <p className="text-[13px] text-[#71717A] mt-4 flex items-center justify-center gap-4 flex-wrap">
            <span>✓ AI-generated</span>
            <span>✓ No code needed</span>
            <span>✓ Free to start</span>
          </p>
        )}

        {!isSignedIn && (
          <div className="flex items-center justify-center gap-3 mt-7 flex-wrap">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
            >
              Start for free →
            </Link>
            <Link
              href="/about"
              className="px-5 py-2.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
            >
              See how it works
            </Link>
          </div>
        )}

        {isSignedIn && (
          <div className="grid grid-cols-3 gap-[10px] max-w-md mx-auto mt-8">
            {loadingUserData ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E4E4E7] rounded-lg p-3 h-[68px] animate-pulse"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                />
              ))
            ) : (
              <>
                <div
                  className="bg-white border border-[#E4E4E7] rounded-lg p-3 text-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <p className="text-2xl font-bold text-accent">{quizzesTaken}</p>
                  <p className="text-[10px] uppercase text-[#A1A1AA] mt-1">Quizzes taken</p>
                </div>
                <div
                  className="bg-white border border-[#E4E4E7] rounded-lg p-3 text-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <p className="text-2xl font-bold text-success">
                    {bestScore === null ? '—' : `${bestScore}%`}
                  </p>
                  <p className="text-[10px] uppercase text-[#A1A1AA] mt-1">Best score</p>
                </div>
                <div
                  className="bg-white border border-[#E4E4E7] rounded-lg p-3 text-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <p className="text-2xl font-bold text-warning">{publishedCount}</p>
                  <p className="text-[10px] uppercase text-[#A1A1AA] mt-1">Published</p>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[10px] font-semibold uppercase text-[#71717A]"
          style={{ letterSpacing: '1px' }}
        >
          {isSignedIn ? 'Continue learning' : 'Quiz banks'}
        </h2>
      </div>

      {(() => {
        // A lone card left-aligned in a wide grid looks abandoned, so the
        // "contribute" invite fills the row out to 2 whenever there's only
        // one real bank. Once there are 2+ banks the grid is already
        // visually populated and the invite isn't needed.
        const showInvite = banks.length === 1;
        const totalItems = banks.length + (showInvite ? 1 : 0);
        const gridClass =
          totalItems === 1
            ? 'grid grid-cols-1 max-w-[420px] mx-auto gap-6'
            : totalItems === 2
            ? 'grid grid-cols-1 sm:grid-cols-2 max-w-[700px] mx-auto gap-6'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[960px] mx-auto gap-6';

        return (
          <section className={gridClass}>
            {banks.map((bank) => {
              const scores = scoreMap[bank.slug];
              return (
                <QuizCard
                  key={bank.slug}
                  bank={bank}
                  practiceScore={scores?.practice ?? null}
                  examScore={scores?.exam ?? null}
                  hasAttempted={Boolean(scores?.practice || scores?.exam)}
                />
              );
            })}
            {showInvite && (
              <a
                href="https://github.com/AutoShiftOps/quizops/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center text-center rounded-xl p-6 hover:border-[#A1A1AA] transition-colors"
                style={{ border: '1px dashed #D4D4D8', background: '#FAFAFA' }}
              >
                <span className="text-3xl mb-3">➕</span>
                <p className="font-heading font-semibold text-[#18181B] mb-1">Add a quiz bank</p>
                <p className="text-sm text-[#71717A] mb-3">
                  Contribute questions on any technical topic — no coding required.
                </p>
                <span className="text-sm text-accent font-medium">See CONTRIBUTING.md →</span>
              </a>
            )}
          </section>
        );
      })()}

      {isSignedIn && hasPublisherProfile ? (
        <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg py-3 px-4">
          {topQuizThisWeek ? (
            <p className="text-[13px] text-[#1D4ED8]">
              📖 <span className="font-medium">{topQuizThisWeek.title}</span> was read by{' '}
              {topQuizThisWeek.readers} {topQuizThisWeek.readers === 1 ? 'person' : 'people'}{' '}
              this week — {topQuizThisWeek.passRate}% passed
            </p>
          ) : mostRecentQuiz ? (
            <p className="text-[13px] text-[#1D4ED8]">
              Share <span className="font-medium">{mostRecentQuiz.title}</span> to get your
              first reader
            </p>
          ) : (
            <p className="text-[13px] text-[#1D4ED8]">You haven&apos;t published a quiz yet</p>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:opacity-90 transition-opacity shrink-0"
          >
            Dashboard →
          </button>
        </div>
      ) : (
        <section className="mt-20 text-center border-t border-[#E4E4E7] pt-10">
          <h2 className="font-heading text-2xl font-semibold mb-2 text-[#18181B]">
            Have a topic to test?
          </h2>
          <p className="text-[#71717A]">
            Anyone can contribute a new quiz bank — no coding required. See{' '}
            <span className="text-accent">CONTRIBUTING.md</span> in the repo to get
            started.
          </p>
        </section>
      )}
    </>
  );
}
