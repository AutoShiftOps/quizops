'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { QuizBank } from '@/lib/types';
import QuizCard from './QuizCard';
import Hero from './Hero';
import BentoGrid from './BentoGrid';
import PublisherCTA from './PublisherCTA';

type Score = { percentage: number; passed: boolean };
type ScoreMap = Record<string, { practice?: Score; exam?: Score }>;

function getFirstName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  const firstName =
    typeof fullName === 'string' && fullName.trim()
      ? fullName.trim().split(' ')[0]
      : user.email?.split('@')[0] ?? 'there';
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

type TopQuiz = { title: string; slug: string; readers: number; passRate: number };
type RecentQuiz = { title: string; slug: string };

type Props = {
  // Already sliced to the current page server-side (see app/page.tsx) —
  // this component never receives (and never has to hydrate/ship) more
  // than one page's worth of banks, regardless of how many exist in total.
  banks: QuizBank[];
  totalBankCount: number;
  currentPage: number;
  totalPages: number;
};

export default function BankGrid({ banks, totalBankCount, currentPage, totalPages }: Props) {
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
      {/* Slim dark announcement bar, immediately below the NavBar and above
          the hero — the quiz/score/published counts that used to live in a
          separate white-card row are folded into this single line instead,
          so there's one personalised element, not two saying similar
          things. Hero itself (incl. the social proof bar) is identical for
          every visitor. */}
      {isSignedIn && user && (
        <div style={{ background: '#0D1420', borderBottom: '1px solid #1E2D45', color: '#F1F5F9', fontSize: 13, padding: '8px 40px' }}>
          <div
            className="mx-auto flex items-center gap-3 flex-wrap"
            style={{ maxWidth: 1080 }}
          >
            <span>
              👋 Welcome back, {getFirstName(user)}
              {!loadingUserData && (
                <>
                  {' '}
                  · {quizzesTaken} {quizzesTaken === 1 ? 'quiz' : 'quizzes'} taken ·{' '}
                  {bestScore === null ? '—' : `${bestScore}%`} best · {publishedCount} published
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <Hero isSignedIn={isSignedIn} />

      <BentoGrid />

      <div
        className="mx-auto px-6 md:px-10"
        style={{ maxWidth: 1080, paddingTop: 40, paddingBottom: 40, background: '#080C14' }}
      >
        <div className="flex items-center justify-between mb-4">
          {isSignedIn ? (
            <h2
              className="text-[10px] font-semibold uppercase"
              style={{ letterSpacing: '1px', color: '#94A3B8' }}
            >
              Continue learning
            </h2>
          ) : (
            <div className="text-center w-full mb-2">
              <span
                className="inline-block font-semibold uppercase mb-3"
                style={{ fontSize: 11, letterSpacing: 1, color: '#94A3B8' }}
              >
                Community quiz banks
              </span>
              <h2
                className="font-heading font-extrabold mb-2"
                style={{ fontSize: 28, letterSpacing: '-0.5px', color: '#F1F5F9' }}
              >
                Test your knowledge
              </h2>
              <p style={{ color: '#94A3B8', fontSize: 15 }}>
                Take a quiz as a reader, or create your own as a publisher.
              </p>
            </div>
          )}
        </div>

        {(() => {
          // A lone card left-aligned in a wide grid looks abandoned, so the
          // "contribute" invite plus a "more banks coming" placeholder fill
          // the row out to 3 whenever there's only one real bank across the
          // whole site. Once there are 2+ banks the grid is already
          // visually populated and neither is needed.
          const showInvite = totalBankCount === 1;
          const totalItems = banks.length + (showInvite ? 2 : 0);
          const gridClass =
            totalItems === 1
              ? 'grid grid-cols-1 max-w-[420px] mx-auto gap-6'
              : totalItems === 2
              ? 'grid grid-cols-1 sm:grid-cols-2 max-w-[700px] mx-auto gap-6'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[960px] mx-auto gap-6';

          return (
            <>
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
                  className="flex flex-col items-center justify-center text-center rounded-xl p-6 transition-colors"
                  style={{ border: '1px dashed #253447', background: '#0D1420' }}
                >
                  <div
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(62,123,250,0.1)',
                      border: '1px solid rgba(62,123,250,0.2)',
                      fontSize: 18,
                      color: '#3E7BFA',
                    }}
                  >
                    +
                  </div>
                  <p className="font-heading font-semibold mb-1" style={{ color: '#F1F5F9' }}>
                    Add a quiz bank
                  </p>
                  <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>
                    Contribute questions on any technical topic — no coding required.
                  </p>
                  <span className="text-sm font-medium" style={{ color: '#3E7BFA' }}>
                    See CONTRIBUTING.md →
                  </span>
                </a>
              )}
              {showInvite && (
                <div
                  className="flex flex-col items-center justify-center text-center rounded-xl p-6"
                  style={{ border: '1px solid #1E2D45', background: '#0D1420', opacity: 0.5 }}
                >
                  <div
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(148,163,184,0.1)',
                      border: '1px solid rgba(148,163,184,0.1)',
                      fontSize: 14,
                      color: '#475569',
                      fontWeight: 700,
                    }}
                  >
                    ···
                  </div>
                  <p className="font-heading font-semibold mb-1" style={{ color: '#F1F5F9' }}>
                    More banks coming
                  </p>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>
                    Terraform, Kubernetes, AWS, Python and more — contributed by the community.
                  </p>
                </div>
              )}
            </section>

            {totalPages > 1 && (
              // Plain <Link>s to ?page=N rather than client state — each
              // page is its own URL, so it's bookmarkable/shareable and the
              // server only ever sends that page's banks (see app/page.tsx).
              <div className="flex items-center justify-center gap-4 mt-8">
                {currentPage === 1 ? (
                  <span
                    className="text-sm px-3 py-1.5 rounded-md border border-dark-border text-content-secondary opacity-40"
                    aria-disabled="true"
                  >
                    ← Previous
                  </span>
                ) : (
                  <Link
                    href={currentPage - 1 === 1 ? '/' : `/?page=${currentPage - 1}`}
                    className="text-sm px-3 py-1.5 rounded-md border border-dark-border text-content-secondary hover:border-dark-border2 hover:text-content-primary transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
                <span style={{ fontSize: 13, color: '#94A3B8' }}>
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage === totalPages ? (
                  <span
                    className="text-sm px-3 py-1.5 rounded-md border border-dark-border text-content-secondary opacity-40"
                    aria-disabled="true"
                  >
                    Next →
                  </span>
                ) : (
                  <Link
                    href={`/?page=${currentPage + 1}`}
                    className="text-sm px-3 py-1.5 rounded-md border border-dark-border text-content-secondary hover:border-dark-border2 hover:text-content-primary transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
            </>
          );
        })()}

        {isSignedIn && hasPublisherProfile && (
          <div
            className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg py-3 px-4"
            style={{ background: 'rgba(62,123,250,0.08)', border: '1px solid rgba(62,123,250,0.2)' }}
          >
            {topQuizThisWeek ? (
              <p className="text-[13px]" style={{ color: '#94A3B8' }}>
                📖{' '}
                <span className="font-medium" style={{ color: '#F1F5F9' }}>
                  {topQuizThisWeek.title}
                </span>{' '}
                was read by {topQuizThisWeek.readers}{' '}
                {topQuizThisWeek.readers === 1 ? 'person' : 'people'} this week —{' '}
                {topQuizThisWeek.passRate}% passed
              </p>
            ) : mostRecentQuiz ? (
              <p className="text-[13px]" style={{ color: '#94A3B8' }}>
                Share{' '}
                <span className="font-medium" style={{ color: '#F1F5F9' }}>
                  {mostRecentQuiz.title}
                </span>{' '}
                to get your first reader
              </p>
            ) : (
              <p className="text-[13px]" style={{ color: '#94A3B8' }}>
                You haven&apos;t published a quiz yet
              </p>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs px-3 py-1.5 rounded-md bg-brand-blue text-white hover:opacity-90 transition-opacity shrink-0"
            >
              Dashboard →
            </button>
          </div>
        )}
      </div>

      {!(isSignedIn && hasPublisherProfile) && <PublisherCTA />}
    </>
  );
}
