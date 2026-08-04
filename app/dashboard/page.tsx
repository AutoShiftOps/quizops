'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher, checkTierLimit } from '@/lib/publisher';
import { Publisher, PublishedQuiz } from '@/lib/types';
import PublisherOnboarding from '@/components/PublisherOnboarding';
import TierBadge from '@/components/TierBadge';
import PublisherQuizCard from '@/components/PublisherQuizCard';

type Stats = {
  totalAttempts: number;
  avgPassRate: number | null;
  readersThisWeek: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [quizzes, setQuizzes] = useState<PublishedQuiz[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAttempts: 0,
    avgPassRate: null,
    readersThisWeek: 0,
  });
  const [passRates, setPassRates] = useState<Record<string, number | null>>({});
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/');
        return;
      }
      setUser(session.user);

      const pub = await getPublisher(supabase, session.user.id);
      setPublisher(pub);

      if (pub) {
        const { data: quizRows } = await supabase
          .from('published_quizzes')
          .select('*')
          .eq('publisher_id', pub.id)
          .order('updated_at', { ascending: false });
        setQuizzes((quizRows as PublishedQuiz[]) ?? []);

        const { data: attemptRows } = await supabase
          .from('published_quiz_attempts')
          .select('quiz_id, passed, attempted_at')
          .eq('publisher_id', pub.id);

        const attempts = attemptRows ?? [];
        const totalAttempts = attempts.length;
        const avgPassRate =
          totalAttempts > 0
            ? Math.round(
                (attempts.filter((a) => a.passed).length / totalAttempts) * 100
              )
            : null;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const readersThisWeek = attempts.filter(
          (a) => new Date(a.attempted_at).getTime() >= sevenDaysAgo
        ).length;

        setStats({ totalAttempts, avgPassRate, readersThisWeek });

        const perQuiz: Record<string, number | null> = {};
        for (const quiz of (quizRows as PublishedQuiz[]) ?? []) {
          const quizAttempts = attempts.filter((a) => a.quiz_id === quiz.id);
          perQuiz[quiz.id] =
            quizAttempts.length > 0
              ? Math.round(
                  (quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100
                )
              : null;
        }
        setPassRates(perQuiz);
      }

      setLoading(false);
    })().catch(() => setLoading(false));
  }, [router]);

  function handleQuizDeleted(quizId: string) {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    setPublisher((prev) =>
      prev ? { ...prev, quiz_count: Math.max(prev.quiz_count - 1, 0) } : prev
    );
  }

  if (loading) {
    return <div className="mt-8 text-center text-gray-500">Loading…</div>;
  }

  if (!user) return null; // redirecting to home

  if (!publisher) {
    return <PublisherOnboarding userId={user.id} />;
  }

  const limitReached = checkTierLimit(publisher);
  const publishedCount = quizzes.filter((q) => q.status === 'published').length;
  const hasAnyAttempts = quizzes.some((q) => q.attempt_count > 0);
  const remainingFree = Math.max(3 - publisher.quiz_count, 0);

  return (
    <div className="max-w-[900px] mx-auto px-6 mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold mb-1">
            Welcome, {publisher.display_name}
          </h1>
          <p className="text-sm text-gray-500 mb-3">
            {origin ? origin.replace(/^https?:\/\//, '') : 'quiz.autoshiftops.com'}/q/
            {publisher.username}
          </p>
          <TierBadge publisher={publisher} />
        </div>
        <Link
          href={limitReached ? '#' : '/dashboard/new'}
          aria-disabled={limitReached}
          title={limitReached ? 'Free tier limit reached — upgrade to Pro' : undefined}
          className={`px-5 py-2.5 rounded-md bg-accent text-white font-medium transition-opacity shrink-0 ${
            limitReached ? 'opacity-40 pointer-events-none' : 'hover:opacity-90'
          }`}
        >
          + Create quiz from article
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-3xl font-bold text-accent mb-1">{publishedCount}</p>
          <p className="text-sm">Published quizzes</p>
          <p className="text-xs text-gray-500">
            {publisher.tier === 'free' ? `${remainingFree} remaining on free` : 'Unlimited'}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-3xl font-bold mb-1">{stats.totalAttempts}</p>
          <p className="text-sm">Total attempts</p>
          <p className="text-xs text-gray-500">Across all quizzes</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-3xl font-bold mb-1">
            {stats.avgPassRate === null ? '—' : `${stats.avgPassRate}%`}
          </p>
          <p className="text-sm">Avg pass rate</p>
          <p className="text-xs text-gray-500">
            {stats.avgPassRate === null ? 'No attempts yet' : 'Across all attempts'}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-3xl font-bold text-green mb-1">{stats.readersThisWeek}</p>
          <p className="text-sm">Readers this week</p>
          <p className="text-xs text-gray-500">Share your quiz link</p>
        </div>
      </div>

      {!hasAnyAttempts && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 mb-8">
          <p className="text-sm text-accent/90">
            💡 <span className="font-semibold text-accent">Get your first reader:</span>{' '}
            Copy your quiz link and add &quot;Test your understanding →&quot; at the end
            of your article. That one CTA typically drives 8–12% click-through from
            engaged readers.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
          Your quizzes
        </h2>
        <span className="text-sm text-gray-500">{publishedCount} published</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {quizzes.map((quiz) => (
          <PublisherQuizCard
            key={quiz.id}
            quiz={quiz}
            username={publisher.username}
            passRate={passRates[quiz.id] ?? null}
            onDeleted={handleQuizDeleted}
          />
        ))}

        {!limitReached && (
          <Link
            href="/dashboard/new"
            className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-accent transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-xl mb-4">
              ✨
            </span>
            <p className="font-heading font-semibold mb-2">Create your next quiz</p>
            <p className="text-sm text-gray-400 mb-5">
              Paste any article URL and get 10 questions in under 60 seconds.
            </p>
            <span className="px-4 py-2 rounded-md border border-border text-sm">
              ✨ Generate with AI
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
