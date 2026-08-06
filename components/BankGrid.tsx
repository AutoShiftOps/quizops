'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher } from '@/lib/publisher';
import { Publisher, QuizBank } from '@/lib/types';
import QuizCard from './QuizCard';

type Score = { percentage: number; passed: boolean };
type ScoreMap = Record<string, { practice?: Score; exam?: Score }>;

export default function BankGrid({ banks }: { banks: QuizBank[] }) {
  const [user, setUser] = useState<User | null>(null);
  const [scoreMap, setScoreMap] = useState<ScoreMap>({});
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [readersThisWeek, setReadersThisWeek] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadForUser(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, u: User) {
      console.log('[BankGrid] fetching scores for user:', u.id);

      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('bank_slug, mode, percentage, passed')
        .eq('user_id', u.id);

      if (attemptsError) {
        // This is the failure mode that used to show up as "score badges
        // just don't appear" with no trace of why — RLS denial, an expired
        // token that failed to refresh, or a bad query would all land here
        // and were previously swallowed because only `data` was destructured.
        console.error('[BankGrid] quiz_attempts query failed:', attemptsError);
      }
      console.log('[BankGrid] quiz_attempts rows:', attempts);

      const grouped = (attempts ?? []).reduce<ScoreMap>((acc, row) => {
        if (!acc[row.bank_slug]) acc[row.bank_slug] = {};
        const score = { percentage: row.percentage, passed: row.passed };
        if (row.mode === 'practice') acc[row.bank_slug].practice = score;
        else if (row.mode === 'exam') acc[row.bank_slug].exam = score;
        return acc;
      }, {});
      console.log('[BankGrid] scoreMap:', grouped);

      if (!active) return;
      setScoreMap(grouped);

      const pub = await getPublisher(supabase, u.id).catch((err) => {
        console.error('[BankGrid] publisher fetch failed:', err);
        return null;
      });
      if (!active) return;
      setPublisher(pub);

      if (pub) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count, error: readersError } = await supabase
          .from('published_quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('publisher_id', pub.id)
          .gte('attempted_at', sevenDaysAgo);
        if (readersError) {
          console.error('[BankGrid] readers-this-week query failed:', readersError);
        }
        if (active) setReadersThisWeek(count ?? 0);
      }
    }

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log('[BankGrid] session user on mount:', session?.user?.id ?? null);

      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) await loadForUser(supabase, session.user);

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
          loadForUser(supabase, newSession.user);
        } else {
          setScoreMap({});
          setPublisher(null);
          setReadersThisWeek(0);
        }
      });

      return () => subscription.unsubscribe();
    })().catch((err) => console.error('[BankGrid] init failed:', err));

    return () => {
      active = false;
    };
  }, []);

  const isSignedIn = Boolean(user);

  return (
    <>
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

      {isSignedIn && publisher ? (
        <section className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-10">
          <p className="text-gray-400">
            <span className="text-white font-medium">Your quizzes</span> ·{' '}
            {publisher.quiz_count} published · {readersThisWeek} readers this week
          </p>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity text-sm shrink-0"
          >
            Go to dashboard →
          </Link>
        </section>
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
