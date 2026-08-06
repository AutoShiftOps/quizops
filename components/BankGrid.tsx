'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function BankGrid({ banks }: { banks: QuizBank[] }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [hasPublisherProfile, setHasPublisherProfile] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [scoreMap, setScoreMap] = useState<ScoreMap>({});
  const [quizzesTaken, setQuizzesTaken] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [readersThisWeek, setReadersThisWeek] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSignedInData(
      supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
      u: User
    ) {
      setLoadingUserData(true);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // All three signed-in-only reads run in parallel — none depends on
      // another's result (publisher_id === auth user id in this schema, so
      // the readers-this-week count doesn't need to wait on the publisher
      // row resolving first).
      const [attemptsResult, publisherResult, readersResult] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('bank_slug, mode, percentage, passed')
          .eq('user_id', u.id),
        supabase.from('publishers').select('*').eq('id', u.id).maybeSingle(),
        supabase
          .from('published_quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('publisher_id', u.id)
          .gte('attempted_at', sevenDaysAgo),
      ]);

      console.log('[BankGrid] user:', u.id);
      console.log('[BankGrid] quiz_attempts response:', attemptsResult);
      console.log('[BankGrid] publishers response:', publisherResult);
      console.log('[BankGrid] published_quiz_attempts response:', readersResult);

      if (attemptsResult.error) {
        // This is the failure mode that used to show up as "score badges
        // just don't appear" with no trace of why — RLS denial, an expired
        // token that failed to refresh, or a bad query would all land here
        // and were previously swallowed because only `data` was destructured.
        console.error('[BankGrid] quiz_attempts query failed:', attemptsResult.error);
      }
      if (publisherResult.error) {
        console.error('[BankGrid] publishers query failed:', publisherResult.error);
      }
      if (readersResult.error) {
        console.error('[BankGrid] published_quiz_attempts query failed:', readersResult.error);
      }

      const attempts = attemptsResult.data ?? [];
      const grouped = attempts.reduce<ScoreMap>((acc, row) => {
        if (!acc[row.bank_slug]) acc[row.bank_slug] = {};
        const score = { percentage: row.percentage, passed: row.passed };
        if (row.mode === 'practice') acc[row.bank_slug].practice = score;
        else if (row.mode === 'exam') acc[row.bank_slug].exam = score;
        return acc;
      }, {});
      console.log('[BankGrid] scoreMap:', grouped);

      if (!active) return;
      setScoreMap(grouped);
      setQuizzesTaken(attempts.length);
      setBestScore(attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null);

      const publisher = publisherResult.data;
      setHasPublisherProfile(publisher !== null);
      setPublishedCount(publisher?.quiz_count ?? 0);
      setReadersThisWeek(readersResult.count ?? 0);
      setLoadingUserData(false);
    }

    function resetToGuest() {
      setScoreMap({});
      setQuizzesTaken(0);
      setBestScore(null);
      setHasPublisherProfile(false);
      setPublishedCount(0);
      setReadersThisWeek(0);
      setLoadingUserData(false);
    }

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log('[BankGrid] session user on mount:', session?.user?.id ?? null);

      if (!active) return;
      setUser(session?.user ?? null);

      // Guest: skip all signed-in-only fetches entirely and render immediately.
      if (!session?.user) {
        resetToGuest();
      } else {
        await loadSignedInData(supabase, session.user);
      }

      // A one-time check on mount misses a sign-in that completes without a
      // full page reload (e.g. the OAuth redirect lands back here before this
      // effect's initial getSession() call resolves). Reacting to auth state
      // changes closes that gap.
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
        <div className="-mx-6 px-6 py-2 mb-10 flex flex-wrap items-center justify-between gap-2 bg-[rgba(108,99,255,0.08)] border-b border-[rgba(108,99,255,0.2)]">
          <span className="text-[13px] text-[#8B83FF]">
            👋 Welcome back, {getFirstName(user)}
          </span>
          {hasPublisherProfile && (
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[12px] text-[#6C63FF] underline hover:opacity-80 transition-opacity"
            >
              Publisher dashboard →
            </button>
          )}
        </div>
      )}

      <section className="text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          Test your technical knowledge
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          {isSignedIn
            ? 'Pick up where you left off, or explore a new topic.'
            : 'Bite-sized quizzes on DevOps, cloud, and engineering fundamentals — sign in to track your progress, or jump in as a guest.'}
        </p>

        {isSignedIn && (
          <div className="grid grid-cols-3 gap-[10px] max-w-md mx-auto mt-8">
            {loadingUserData ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-[#111118] border border-border rounded-lg p-3 h-[68px] animate-pulse"
                />
              ))
            ) : (
              <>
                <div className="bg-[#111118] border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#6C63FF]">{quizzesTaken}</p>
                  <p className="text-[10px] uppercase text-[#6B6882] mt-1">Quizzes taken</p>
                </div>
                <div className="bg-[#111118] border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {bestScore === null ? '—' : `${bestScore}%`}
                  </p>
                  <p className="text-[10px] uppercase text-[#6B6882] mt-1">Best score</p>
                </div>
                <div className="bg-[#111118] border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-500">{publishedCount}</p>
                  <p className="text-[10px] uppercase text-[#6B6882] mt-1">Published</p>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
          {isSignedIn ? 'Continue learning' : 'Quiz banks'}
        </h2>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </section>

      {isSignedIn && hasPublisherProfile ? (
        <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3 bg-[#111118] border border-[rgba(108,99,255,0.2)] rounded-lg py-3 px-4">
          <div>
            <p className="text-[13px] font-medium">Your quizzes</p>
            <p className="text-[11px] text-[#6B6882] mt-0.5">
              {publishedCount} published · {readersThisWeek} readers this week
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-md bg-[#6C63FF] text-white hover:opacity-90 transition-opacity shrink-0"
          >
            Go to dashboard →
          </button>
        </div>
      ) : (
        <section className="mt-20 text-center border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-semibold mb-2">
            Have a topic to test?
          </h2>
          <p className="text-gray-400">
            Anyone can contribute a new quiz bank — no coding required. See{' '}
            <span className="text-accent">CONTRIBUTING.md</span> in the repo to get
            started.
          </p>
        </section>
      )}
    </>
  );
}
