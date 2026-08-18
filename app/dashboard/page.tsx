'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher, checkTierLimit } from '@/lib/publisher';
import { Publisher, PublishedQuiz } from '@/lib/types';
import { track } from '@/lib/analytics';
import PublisherOnboarding from '@/components/PublisherOnboarding';
import TierBadge from '@/components/TierBadge';
import PublisherQuizCard from '@/components/PublisherQuizCard';
import WaitlistModal from '@/components/WaitlistModal';

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
  // Stripe isn't built yet (M2-01) — every "Upgrade" CTA on this page opens
  // the waitlist modal in the meantime rather than a fake "coming soon"
  // toast. Replaces the old showUpgradeModal feature-list dialog (whose own
  // internal "Upgrade to Pro" button had the exact same problem) — one
  // consistent upgrade path instead of two.
  const [showWaitlist, setShowWaitlist] = useState(false);

  // Placed before the loading/onboarding early returns below (hooks can't
  // follow a conditional return), keyed off `publisher` directly rather
  // than a `limitReached` local, since that's only computed after those
  // returns.
  useEffect(() => {
    if (publisher && checkTierLimit(publisher)) {
      track('upgrade_prompt_shown');
    }
  }, [publisher]);

  useEffect(() => {
    setOrigin(window.location.origin);

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        // Every "Start for free" CTA site-wide (Hero, Pricing, PublisherCTA,
        // WaitlistModal) links straight here — this used to just bounce
        // guests back to '/' with router.replace, silently, no sign-in
        // prompt at all. From a visitor's perspective clicking the button
        // did nothing (flash back to the same homepage). Trigger Google
        // sign-in directly instead, same as NavBar's own button, and land
        // them back on /dashboard (not just the origin) once it completes
        // so they don't have to click twice.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
          },
        });
        if (error) {
          console.error('[dashboard] sign-in redirect failed:', error);
          router.replace('/');
        }
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
    setQuizzes((prev) => {
      const deleted = prev.find((q) => q.id === quizId);
      // Drafts never counted against quiz_count, so only decrement the
      // locally-displayed count for a quiz that was actually published.
      if (deleted?.status === 'published') {
        setPublisher((p) => (p ? { ...p, quiz_count: Math.max(p.quiz_count - 1, 0) } : p));
      }
      return prev.filter((q) => q.id !== quizId);
    });
  }

  function handleQuizPublished(quizId: string) {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, status: 'published' } : q))
    );
    setPublisher((prev) => (prev ? { ...prev, quiz_count: prev.quiz_count + 1 } : prev));
  }

  if (loading) {
    return <div className="mt-8 text-center text-[#94A3B8]">Loading…</div>;
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
          <h1 className="font-heading text-2xl font-semibold mb-1 text-[#F1F5F9]">
            Welcome, {publisher.display_name}
          </h1>
          <Link
            href={`/q/${publisher.username}`}
            className="inline-block text-sm text-[#94A3B8] hover:text-[#F1F5F9] hover:underline transition-colors mb-4"
          >
            {origin ? origin.replace(/^https?:\/\//, '') : 'quiz.autoshiftops.com'}/q/
            {publisher.username}
          </Link>
          <TierBadge publisher={publisher} />
        </div>
        {limitReached ? (
          <button
            onClick={() => setShowWaitlist(true)}
            className="px-5 py-2.5 rounded-md bg-warning/10 text-warning border border-warning/40 font-medium hover:bg-warning/20 transition-colors shrink-0"
          >
            Upgrade to create more
          </button>
        ) : (
          <Link
            href="/dashboard/new"
            className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            + Create quiz
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold text-accent mb-1">{publishedCount}</p>
          <p className="text-sm text-[#F1F5F9]">Published quizzes</p>
          <p className="text-xs text-[#475569]">
            {publisher.tier === 'free' ? `${remainingFree} remaining on free` : 'Unlimited'}
          </p>
        </div>
        <div
          className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold mb-1 text-[#F1F5F9]">{stats.totalAttempts}</p>
          <p className="text-sm text-[#F1F5F9]">Total attempts</p>
          <p className="text-xs text-[#475569]">Across all quizzes</p>
        </div>
        <div
          className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold mb-1 text-[#F1F5F9]">
            {stats.avgPassRate === null ? '—' : `${stats.avgPassRate}%`}
          </p>
          <p className="text-sm text-[#F1F5F9]">Avg pass rate</p>
          <p className="text-xs text-[#475569]">
            {stats.avgPassRate === null ? 'No attempts yet' : 'Across all attempts'}
          </p>
        </div>
        <div
          className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold text-success mb-1">{stats.readersThisWeek}</p>
          <p className="text-sm text-[#F1F5F9]">Readers this week</p>
          <p className="text-xs text-[#475569]">Share your quiz link</p>
        </div>
      </div>

      {!hasAnyAttempts && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-8">
          <p className="text-sm text-[#F1F5F9]">
            💡 <span className="font-semibold text-accent">Get your first reader:</span>{' '}
            Copy your quiz link and add &quot;Test your understanding →&quot; at the end
            of your article. That one CTA typically drives 8–12% click-through from
            engaged readers.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold tracking-wider text-[#94A3B8] uppercase">
          Your quizzes
        </h2>
        <span className="text-sm text-[#94A3B8]">{publishedCount} published</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {quizzes.map((quiz) => (
          <PublisherQuizCard
            key={quiz.id}
            quiz={quiz}
            username={publisher.username}
            tier={publisher.tier}
            passRate={passRates[quiz.id] ?? null}
            onDeleted={handleQuizDeleted}
            onPublished={handleQuizPublished}
          />
        ))}

        {limitReached ? (
          <div className="bg-[#0F1520] border border-warning/30 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <span className="w-12 h-12 rounded-lg bg-warning/10 text-warning flex items-center justify-center text-xl mb-4">
              🔒
            </span>
            <p className="font-heading font-semibold mb-2 text-[#F1F5F9]">
              Upgrade to add more quizzes
            </p>
            <p className="text-sm text-[#94A3B8] mb-5">You&apos;ve used all 3 free slots.</p>
            <button
              onClick={() => setShowWaitlist(true)}
              className="px-4 py-2 rounded-md border border-warning/40 text-warning text-sm hover:bg-warning/10 transition-colors"
            >
              Learn about Pro →
            </button>
          </div>
        ) : (
          <Link
            href="/dashboard/new"
            className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#253447] transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xl mb-4">
              ✨
            </span>
            <p className="font-heading font-semibold mb-2 text-[#F1F5F9]">Create your next quiz</p>
            <p className="text-sm text-[#94A3B8] mb-5">
              Generate from an article with AI, or write your own questions from scratch.
            </p>
            <span className="px-4 py-2 rounded-md border border-[#1E2D45] text-sm text-[#F1F5F9]">
              + Create quiz
            </span>
          </Link>
        )}
      </div>

      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
    </div>
  );
}
