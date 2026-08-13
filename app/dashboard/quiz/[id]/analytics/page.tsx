'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import WaitlistModal from '@/components/WaitlistModal';

type DaysFilter = '7' | '30' | 'all';

type QuestionPerf = {
  id: string;
  index: number;
  text: string;
  correctRate: number | null;
  seen: number;
  needsAttention: boolean;
};

type DayBucket = { date: string; count: number; passed: number };

type RecentAttempt = {
  id: string;
  isGuest: boolean;
  label: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  timeTakenS: number;
  attemptedAt: string;
};

type AnalyticsData = {
  quiz: { id: string; title: string; source_url: string | null; slug: string; created_at: string };
  publisher: { tier: string; username: string | null };
  requestedDays: number;
  effectiveDays: number;
  capped: boolean;
  analytics: { total: number; passed: number; passRate: number; avgScore: number; avgTime: number };
  questionPerformance: QuestionPerf[];
  attemptsOverTime: DayBucket[];
  recentAttempts: RecentAttempt[];
};

async function authHeader(): Promise<Record<string, string>> {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ''}` };
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}m ${s}s`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

function performanceColor(rate: number): string {
  if (rate >= 75) return '#22C55E';
  if (rate >= 50) return '#F59E0B';
  return '#EF4444';
}

export default function QuizAnalyticsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const quizId = params.id;

  const [days, setDays] = useState<DaysFilter>('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/');
        return;
      }

      const headers = await authHeader();
      const res = await fetch(`/api/quiz/${quizId}/analytics?days=${days}`, { headers });
      if (!active) return;

      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const json = (await res.json()) as AnalyticsData;
      setData(json);
      setLoading(false);
    })().catch(() => {
      if (active) {
        setNotFound(true);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [quizId, days, router]);

  if (notFound) {
    router.replace('/dashboard');
    return null;
  }

  if (loading || !data) {
    return <div className="mt-8 text-center text-[#94A3B8]">Loading…</div>;
  }

  const { quiz, publisher, analytics, questionPerformance, attemptsOverTime, recentAttempts, capped } = data;

  const quizUrl =
    typeof window !== 'undefined' && publisher.username
      ? `${window.location.origin}/q/${publisher.username}/${quiz.slug}`
      : '';
  const embedSnippet = `<a href="${quizUrl}">Test your understanding →</a>`;

  async function copyLink() {
    await navigator.clipboard.writeText(quizUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  }

  const daysLabel = days === '7' ? 'last 7 days' : days === '30' ? 'last 30 days' : 'all time';
  const maxOverTime = Math.max(1, ...attemptsOverTime.map((d) => d.count));

  return (
    <div className="max-w-[960px] mx-auto px-6 mt-8 pb-16">
      {/* HEADER */}
      <Link
        href={`/dashboard/quiz/${quizId}`}
        className="inline-block text-sm mb-4 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
      >
        ← Back to quiz
      </Link>
      <h1 className="font-heading text-2xl font-semibold mb-1 text-[#F1F5F9]">{quiz.title}</h1>
      <div className="flex items-center gap-3 flex-wrap mb-6" style={{ fontSize: 13, color: '#475569' }}>
        {quiz.source_url && (
          <a
            href={quiz.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: '#3E7BFA' }}
          >
            {quiz.source_url.replace(/^https?:\/\//, '')}
          </a>
        )}
        <span>Published {new Date(quiz.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>

      {/* FILTER ROW */}
      <div className="inline-flex items-center rounded-md p-1 mb-6" style={{ background: '#161D2E' }}>
        {(['7', '30', 'all'] as DaysFilter[]).map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={days === d ? { background: '#0F1520', color: '#F1F5F9' } : { color: '#94A3B8' }}
          >
            {d === '7' ? '7 days' : d === '30' ? '30 days' : 'All time'}
          </button>
        ))}
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5">
          <p className="text-3xl font-bold mb-1" style={{ color: '#3E7BFA' }}>{analytics.total}</p>
          <p className="text-sm text-[#F1F5F9]">Readers</p>
          <p className="text-xs text-[#475569]">in {daysLabel}</p>
        </div>
        <div className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5">
          <p className="text-3xl font-bold mb-1" style={{ color: analytics.passRate >= 70 ? '#22C55E' : '#F59E0B' }}>
            {analytics.passRate}%
          </p>
          <p className="text-sm text-[#F1F5F9]">Pass rate</p>
          <p className="text-xs text-[#475569]">{analytics.passed} of {analytics.total} passed</p>
        </div>
        <div className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5">
          <p className="text-3xl font-bold mb-1 text-[#F1F5F9]">{analytics.avgScore}%</p>
          <p className="text-sm text-[#F1F5F9]">Avg score</p>
          <p className="text-xs text-[#475569]">across all attempts</p>
        </div>
        <div className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5">
          <p className="text-3xl font-bold mb-1 text-[#F1F5F9]">
            {Math.floor(analytics.avgTime / 60)}m {analytics.avgTime % 60}s
          </p>
          <p className="text-sm text-[#F1F5F9]">Avg time</p>
          <p className="text-xs text-[#475569]">to complete quiz</p>
        </div>
      </div>

      {/* FREE TIER NOTICE */}
      {capped && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg py-3 px-4 mb-6 bg-warning/10 border border-warning/40">
          <p className="text-sm text-warning">
            Showing last 7 days — upgrade to Pro for full analytics history
          </p>
          <button
            onClick={() => setShowWaitlist(true)}
            className="text-xs px-3 py-1.5 rounded-md border border-warning/40 text-warning hover:bg-warning/20 transition-colors shrink-0"
          >
            Upgrade to Pro →
          </button>
        </div>
      )}

      {/* QUESTION PERFORMANCE */}
      <div className="mb-10">
        <h2 className="font-heading text-lg font-semibold mb-1 text-[#F1F5F9]">Question performance</h2>
        <p className="text-sm text-[#94A3B8] mb-4">Which questions did your readers miss most?</p>

        {analytics.total === 0 ? (
          <div className="flex flex-col items-center text-center bg-[#0F1520] border border-[#1E2D45] rounded-xl" style={{ padding: '48px 24px' }}>
            <div aria-hidden="true" style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p className="font-medium text-[#F1F5F9] mb-1">No attempts yet</p>
            <p className="text-sm text-[#94A3B8] mb-5">Share your quiz link to get your first reader</p>
            <button
              onClick={copyLink}
              disabled={!quizUrl}
              className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {copiedLink ? 'Copied!' : 'Copy quiz link'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {questionPerformance.map((q) => {
              const color = q.correctRate === null ? '#475569' : performanceColor(q.correctRate);
              const truncated = q.text.length > 60 ? `${q.text.slice(0, 60)}…` : q.text;
              return (
                <div key={q.id} className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 shrink-0" style={{ minWidth: 220 }}>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: '#161D2E', color: '#94A3B8' }}
                      >
                        Q{q.index}
                      </span>
                      <span className="text-sm text-[#F1F5F9] truncate">{truncated}</span>
                    </div>
                    <div className="flex-1">
                      {q.correctRate === null ? (
                        <span className="text-sm text-[#475569]">—</span>
                      ) : (
                        <div style={{ background: '#161D2E', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${q.correctRate}%`,
                              height: '100%',
                              background: color,
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold shrink-0" style={{ color, minWidth: 40, textAlign: 'right' }}>
                      {q.correctRate === null ? '—' : `${q.correctRate}%`}
                    </span>
                  </div>
                  {q.needsAttention && (
                    <p
                      className="text-xs mt-2"
                      style={{ color: '#F59E0B' }}
                      title="Less than half your readers answered this correctly — consider rewriting this section of your article"
                    >
                      ⚠ Needs attention
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ATTEMPTS OVER TIME */}
      {attemptsOverTime.length >= 2 && (
        <div className="mb-10">
          <h2 className="font-heading text-lg font-semibold mb-4 text-[#F1F5F9]">Readers over time</h2>
          <div className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-5">
            <div className="flex items-end" style={{ height: 80, gap: 4 }}>
              {attemptsOverTime.map((d) => (
                <div
                  key={d.date}
                  className="flex-1"
                  title={`${d.date}: ${d.count} ${d.count === 1 ? 'reader' : 'readers'}`}
                  style={{
                    height: `${Math.max(4, (d.count / maxOverTime) * 80)}px`,
                    background: '#3E7BFA',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              ))}
            </div>
            <div className="flex" style={{ gap: 4, marginTop: 8 }}>
              {attemptsOverTime.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 text-center"
                  style={{
                    fontSize: 10,
                    color: '#475569',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'top left',
                    whiteSpace: 'nowrap',
                    marginLeft: 8,
                  }}
                >
                  {d.date}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECENT ATTEMPTS */}
      <div className="mb-10">
        <h2 className="font-heading text-lg font-semibold mb-4 text-[#F1F5F9]">Recent attempts</h2>
        {recentAttempts.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">No attempts yet</p>
        ) : (
          <div className="space-y-2">
            {recentAttempts.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-[#0F1520] border border-[#1E2D45] rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: a.isGuest ? '#161D2E' : 'rgba(62,123,250,0.15)', color: a.isGuest ? '#94A3B8' : '#3E7BFA' }}
                  >
                    {a.isGuest ? 'G' : a.label[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm text-[#F1F5F9]">{a.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: a.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: a.passed ? '#22C55E' : '#EF4444',
                    }}
                  >
                    {a.percentage}% {a.passed ? '✓' : '✗'}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{a.score}/{a.total} correct</span>
                </div>
                <div className="text-right" style={{ fontSize: 12, color: '#475569' }}>
                  <div>{formatTime(a.timeTakenS)}</div>
                  <div>{relativeTime(a.attemptedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SHARE PROMPT */}
      {analytics.total === 0 && (
        <div className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-6">
          <h2 className="font-heading text-lg font-semibold mb-4 text-[#F1F5F9]">
            Share this quiz to get your first reader
          </h2>

          <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: '#475569', letterSpacing: '0.05em' }}>
            Quiz URL
          </p>
          <div className="flex items-stretch gap-2 mb-5">
            <code
              className="flex-1 px-3 py-2 rounded-md text-xs overflow-x-auto whitespace-nowrap"
              style={{ background: '#161D2E', border: '1px solid #1E2D45', color: '#94A3B8' }}
            >
              {quizUrl || `quiz.autoshiftops.com/q/${publisher.username ?? '…'}/${quiz.slug}`}
            </code>
            <button
              onClick={copyLink}
              disabled={!quizUrl}
              className="px-4 py-2 rounded-md border border-[#1E2D45] text-[#F1F5F9] hover:border-[#253447] transition-colors text-sm shrink-0 disabled:opacity-50"
            >
              {copiedLink ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: '#475569', letterSpacing: '0.05em' }}>
            Suggested embed
          </p>
          <p className="text-sm text-[#94A3B8] mb-2">Add this to the end of your article:</p>
          <div className="flex items-stretch gap-2">
            <code
              className="flex-1 px-3 py-2 rounded-md text-xs overflow-x-auto whitespace-nowrap"
              style={{ background: '#161D2E', border: '1px solid #1E2D45', color: '#94A3B8' }}
            >
              {embedSnippet}
            </code>
            <button
              onClick={copyEmbed}
              disabled={!quizUrl}
              className="px-4 py-2 rounded-md border border-[#1E2D45] text-[#F1F5F9] hover:border-[#253447] transition-colors text-sm shrink-0 disabled:opacity-50"
            >
              {copiedEmbed ? 'Copied!' : 'Copy embed'}
            </button>
          </div>
        </div>
      )}

      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
    </div>
  );
}
