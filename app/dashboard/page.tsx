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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [quizzes, setQuizzes] = useState<PublishedQuiz[]>([]);

  useEffect(() => {
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
        const { data } = await supabase
          .from('published_quizzes')
          .select('*')
          .eq('publisher_id', pub.id)
          .order('updated_at', { ascending: false });
        setQuizzes((data as PublishedQuiz[]) ?? []);
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

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold mb-2">
            Welcome, {publisher.display_name}
          </h1>
          <TierBadge publisher={publisher} />
        </div>
        <Link
          href={limitReached ? '#' : '/dashboard/new'}
          aria-disabled={limitReached}
          title={limitReached ? 'Free tier limit reached — upgrade to Pro' : undefined}
          className={`px-5 py-2.5 rounded-md bg-accent text-white font-medium transition-opacity ${
            limitReached ? 'opacity-40 pointer-events-none' : 'hover:opacity-90'
          }`}
        >
          + Create quiz from article
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-gray-400 mb-4">You haven&apos;t created any quizzes yet.</p>
          <Link href="/dashboard/new" className="text-accent hover:underline">
            Create your first quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <PublisherQuizCard
              key={quiz.id}
              quiz={quiz}
              username={publisher.username}
              onDeleted={handleQuizDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
