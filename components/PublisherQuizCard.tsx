'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { PublishedQuiz } from '@/lib/types';

type Props = {
  quiz: PublishedQuiz;
  username: string;
  passRate: number | null;
  onDeleted: (quizId: string) => void;
  onPublished: (quizId: string) => void;
};

async function authHeader(): Promise<Record<string, string>> {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ''}` };
}

// Shared action-row button styles — all buttons in this row must share the
// same box model (height/padding/border-radius/font-size) so they sit on one
// baseline regardless of icon glyph or label length. No vertical padding or
// min-height here: height is fixed via h-8, content is centered by
// inline-flex + items-center + justify-center instead.
const BTN =
  'inline-flex items-center justify-center gap-1 h-8 px-3 rounded-md text-[13px] font-medium whitespace-nowrap border border-[#1E2D45] bg-transparent text-[#94A3B8] hover:border-[#253447] hover:text-[#F1F5F9] hover:bg-[#161D2E] transition-colors';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1 h-8 px-3 rounded-md text-[13px] font-medium whitespace-nowrap bg-accent text-white hover:opacity-90 transition-opacity';
const BTN_ICON_ONLY =
  'ml-auto inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#1E2D45] bg-transparent text-[#475569] hover:border-[rgba(239,68,68,0.3)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.05)] transition-colors';
// Icons sit in their own span at a fixed, sub-line-height size so a taller
// emoji glyph (e.g. 📊) never stretches the button's height.
const ICON = 'text-xs leading-none';

export default function PublisherQuizCard({
  quiz,
  username,
  passRate,
  onDeleted,
  onPublished,
}: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const isDraft = quiz.status === 'draft';

  const quizUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/q/${username}/${quiz.slug}`
      : `/q/${username}/${quiz.slug}`;

  async function handleShare() {
    await navigator.clipboard.writeText(quizUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    const headers = await authHeader();
    const res = await fetch(`/api/quiz/${quiz.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ status: 'published' }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setPublishError(json.message || 'Could not publish. Please try again.');
      setPublishing(false);
      return;
    }
    onPublished(quiz.id);
    setPublishing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const headers = await authHeader();
    await fetch(`/api/quiz/${quiz.id}`, { method: 'DELETE', headers });
    onDeleted(quiz.id);
  }

  return (
    <div
      className="bg-[#0F1520] border border-[#1E2D45] rounded-xl p-6"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{quiz.emoji}</span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            quiz.status === 'published'
              ? 'bg-success/10 text-success'
              : 'bg-[#161D2E] text-[#94A3B8]'
          }`}
        >
          {quiz.status === 'published' ? '✓ Published' : '✎ Draft'}
        </span>
      </div>

      <h3 className="font-heading font-semibold text-lg mb-1 text-[#F1F5F9]">{quiz.title}</h3>

      {quiz.source_url && (
        <p className="text-xs text-[#475569] truncate mb-4">
          {quiz.source_url.replace(/^https?:\/\//, '')}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-[#94A3B8] mb-4">
        <span>{quiz.attempt_count} attempts</span>
        <span>{passRate === null ? '—' : `${passRate}%`} pass rate</span>
      </div>

      {publishError && <p className="text-xs text-danger mb-3">{publishError}</p>}

      <div className="flex items-center gap-2 pt-3 border-t border-[#1E2D45] flex-nowrap">
        {isDraft ? (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`${BTN_PRIMARY} disabled:opacity-50`}
          >
            <span className={ICON}>✓</span>
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        ) : (
          <a
            href={`/q/${username}/${quiz.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={BTN}
          >
            View
          </a>
        )}
        <Link href={`/dashboard/quiz/${quiz.id}`} className={BTN}>
          <span className={ICON}>✎</span>
          Edit
        </Link>
        <Link href={`/dashboard/quiz/${quiz.id}/analytics`} className={BTN}>
          <span className={ICON}>📊</span>
          Analytics
        </Link>
        {!isDraft && (
          <button onClick={handleShare} className={BTN}>
            <span className={ICON}>🔗</span>
            {copied ? 'Copied!' : 'Share'}
          </button>
        )}
        <button
          onClick={() => setConfirmingDelete(true)}
          title="Delete quiz"
          className={BTN_ICON_ONLY}
        >
          <span className="text-sm leading-none">🗑️</span>
        </button>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-[#1E2D45] bg-[#0F1520] p-6 text-center">
            <h3 className="font-heading text-lg font-semibold mb-2 text-[#F1F5F9]">
              Delete this quiz?
            </h3>
            <p className="text-sm text-[#94A3B8] mb-6">
              This permanently deletes &quot;{quiz.title}&quot; and its attempt history.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-md bg-danger text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="px-5 py-2 rounded-md border border-[#1E2D45] text-[#F1F5F9] hover:border-[#253447] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
