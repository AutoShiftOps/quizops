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
      className="bg-white border border-[#E4E4E7] rounded-xl p-6"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{quiz.emoji}</span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            quiz.status === 'published'
              ? 'bg-success/10 text-success'
              : 'bg-[#F4F4F5] text-[#71717A]'
          }`}
        >
          {quiz.status === 'published' ? '✓ Published' : '✎ Draft'}
        </span>
      </div>

      <h3 className="font-heading font-semibold text-lg mb-1 text-[#18181B]">{quiz.title}</h3>

      {quiz.source_url && (
        <p className="text-xs text-[#A1A1AA] truncate mb-4">
          {quiz.source_url.replace(/^https?:\/\//, '')}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-[#71717A] mb-4">
        <span>{quiz.attempt_count} attempts</span>
        <span>{passRate === null ? '—' : `${passRate}%`} pass rate</span>
      </div>

      {publishError && <p className="text-xs text-danger mb-3">{publishError}</p>}

      <div className="border-t border-[#E4E4E7] pt-4 flex items-center gap-2 text-sm">
        {isDraft ? (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-3 py-1.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : '✓ Publish'}
          </button>
        ) : (
          <a
            href={`/q/${username}/${quiz.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
          >
            View
          </a>
        )}
        <Link
          href={`/dashboard/quiz/${quiz.id}`}
          className="px-3 py-1.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
        >
          ✎ Edit
        </Link>
        {!isDraft && (
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
          >
            {copied ? 'Copied!' : '🔗 Share'}
          </button>
        )}
        <button
          onClick={() => setConfirmingDelete(true)}
          title="Delete quiz"
          className="ml-auto px-3 py-1.5 rounded-md border border-danger/40 text-danger hover:bg-danger/10 transition-colors"
        >
          🗑️
        </button>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-[#E4E4E7] bg-white p-6 text-center">
            <h3 className="font-heading text-lg font-semibold mb-2 text-[#18181B]">
              Delete this quiz?
            </h3>
            <p className="text-sm text-[#71717A] mb-6">
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
                className="px-5 py-2 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
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
