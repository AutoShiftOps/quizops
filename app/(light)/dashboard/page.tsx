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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showProComingSoonToast() {
    setToast("Pro tier coming soon! We'll notify you when it's available.");
    setTimeout(() => setToast(null), 3000);
  }

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
    return <div className="mt-8 text-center text-[#71717A]">Loading…</div>;
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
          <h1 className="font-heading text-2xl font-semibold mb-1 text-[#18181B]">
            Welcome, {publisher.display_name}
          </h1>
          <p className="text-sm text-[#71717A] mb-3">
            {origin ? origin.replace(/^https?:\/\//, '') : 'quiz.autoshiftops.com'}/q/
            {publisher.username}
          </p>
          <TierBadge publisher={publisher} />
        </div>
        {limitReached ? (
          <button
            onClick={() => setShowUpgradeModal(true)}
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
          className="bg-white border border-[#E4E4E7] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold text-accent mb-1">{publishedCount}</p>
          <p className="text-sm text-[#18181B]">Published quizzes</p>
          <p className="text-xs text-[#A1A1AA]">
            {publisher.tier === 'free' ? `${remainingFree} remaining on free` : 'Unlimited'}
          </p>
        </div>
        <div
          className="bg-white border border-[#E4E4E7] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold mb-1 text-[#18181B]">{stats.totalAttempts}</p>
          <p className="text-sm text-[#18181B]">Total attempts</p>
          <p className="text-xs text-[#A1A1AA]">Across all quizzes</p>
        </div>
        <div
          className="bg-white border border-[#E4E4E7] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold mb-1 text-[#18181B]">
            {stats.avgPassRate === null ? '—' : `${stats.avgPassRate}%`}
          </p>
          <p className="text-sm text-[#18181B]">Avg pass rate</p>
          <p className="text-xs text-[#A1A1AA]">
            {stats.avgPassRate === null ? 'No attempts yet' : 'Across all attempts'}
          </p>
        </div>
        <div
          className="bg-white border border-[#E4E4E7] rounded-xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-3xl font-bold text-success mb-1">{stats.readersThisWeek}</p>
          <p className="text-sm text-[#18181B]">Readers this week</p>
          <p className="text-xs text-[#A1A1AA]">Share your quiz link</p>
        </div>
      </div>

      {!hasAnyAttempts && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-8">
          <p className="text-sm text-[#18181B]">
            💡 <span className="font-semibold text-accent">Get your first reader:</span>{' '}
            Copy your quiz link and add &quot;Test your understanding →&quot; at the end
            of your article. That one CTA typically drives 8–12% click-through from
            engaged readers.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold tracking-wider text-[#71717A] uppercase">
          Your quizzes
        </h2>
        <span className="text-sm text-[#71717A]">{publishedCount} published</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {quizzes.map((quiz) => (
          <PublisherQuizCard
            key={quiz.id}
            quiz={quiz}
            username={publisher.username}
            passRate={passRates[quiz.id] ?? null}
            onDeleted={handleQuizDeleted}
            onPublished={handleQuizPublished}
          />
        ))}

        {limitReached ? (
          <div className="bg-white border border-warning/30 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <span className="w-12 h-12 rounded-lg bg-warning/10 text-warning flex items-center justify-center text-xl mb-4">
              🔒
            </span>
            <p className="font-heading font-semibold mb-2 text-[#18181B]">
              Upgrade to add more quizzes
            </p>
            <p className="text-sm text-[#71717A] mb-5">You&apos;ve used all 3 free slots.</p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 rounded-md border border-warning/40 text-warning text-sm hover:bg-warning/10 transition-colors"
            >
              Learn about Pro →
            </button>
          </div>
        ) : (
          <Link
            href="/dashboard/new"
            className="bg-white border border-[#E4E4E7] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#D4D4D8] transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xl mb-4">
              ✨
            </span>
            <p className="font-heading font-semibold mb-2 text-[#18181B]">Create your next quiz</p>
            <p className="text-sm text-[#71717A] mb-5">
              Generate from an article with AI, or write your own questions from scratch.
            </p>
            <span className="px-4 py-2 rounded-md border border-[#E4E4E7] text-sm text-[#18181B]">
              + Create quiz
            </span>
          </Link>
        )}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-[#E4E4E7] bg-white p-6">
            <h3 className="font-heading text-lg font-semibold mb-2 text-[#18181B]">
              You&apos;ve reached the free limit
            </h3>
            <p className="text-sm text-[#71717A] mb-4">
              Free tier includes 3 published quizzes. Upgrade to Pro for:
            </p>
            <ul className="text-sm text-[#18181B] space-y-1.5 mb-6">
              <li>✓ Unlimited quizzes</li>
              <li>✓ Full analytics history</li>
              <li>✓ Remove QuizOps branding</li>
              <li>✓ iFrame embed support</li>
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  showProComingSoonToast();
                }}
                className="flex-1 px-4 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity text-sm"
              >
                Upgrade to Pro →
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-[#E4E4E7] px-4 py-2.5 rounded-md shadow-lg text-sm text-[#18181B]">
          {toast}
        </div>
      )}
    </div>
  );
}
