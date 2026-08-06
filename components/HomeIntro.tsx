'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher } from '@/lib/publisher';

type Stats = {
  quizzesTaken: number;
  bestScore: number | null;
  published: number;
};

function getFirstName(user: User): string {
  const name =
    user.user_metadata?.given_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'there';
  return String(name).split(' ')[0];
}

export default function HomeIntro() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({ quizzesTaken: 0, bestScore: null, published: 0 });

  useEffect(() => {
    let active = true;

    async function loadStats(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, u: User) {
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('percentage')
        .eq('user_id', u.id);
      if (attemptsError) {
        console.error('[HomeIntro] quiz_attempts fetch failed:', attemptsError);
      }

      const publisher = await getPublisher(supabase, u.id).catch((err) => {
        console.error('[HomeIntro] publisher fetch failed:', err);
        return null;
      });

      if (!active) return;
      setStats({
        quizzesTaken: attempts?.length ?? 0,
        bestScore:
          attempts && attempts.length > 0
            ? Math.max(...attempts.map((a) => a.percentage))
            : null,
        published: publisher?.quiz_count ?? 0,
      });
    }

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) await loadStats(supabase, session.user);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!active) return;
        setUser(newSession?.user ?? null);
        if (newSession?.user) loadStats(supabase, newSession.user);
      });

      return () => subscription.unsubscribe();
    })().catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {user && (
        <div className="bg-accent/10 border-b border-accent/20 -mx-6 px-6 py-2.5 mb-10 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-accent">👋 Welcome back, {getFirstName(user)}</span>
          <Link href="/dashboard" className="text-accent hover:underline">
            View publisher dashboard →
          </Link>
        </div>
      )}

      <section className="text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          Test your technical knowledge
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          {user
            ? 'Pick up where you left off, or explore a new topic.'
            : 'Bite-sized quizzes on DevOps, cloud, and engineering fundamentals — sign in to track your progress, or jump in as a guest.'}
        </p>

        {user && (
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-accent">{stats.quizzesTaken}</p>
              <p className="text-xs text-gray-500">Quizzes taken</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-2xl font-bold">
                {stats.bestScore === null ? '—' : `${stats.bestScore}%`}
              </p>
              <p className="text-xs text-gray-500">Best score</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-green">{stats.published}</p>
              <p className="text-xs text-gray-500">Published</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
