'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { decrementQuizCount } from '@/lib/publisher';
import { PublishedQuiz } from '@/lib/types';

type Props = {
  quiz: PublishedQuiz;
  username: string;
  onDeleted: (quizId: string) => void;
};

export default function PublisherQuizCard({ quiz, username, onDeleted }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const quizUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/q/${username}/${quiz.slug}`
      : `/q/${username}/${quiz.slug}`;

  async function handleShare() {
    await navigator.clipboard.writeText(quizUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = await getSupabaseClient();
    await supabase.from('published_quizzes').delete().eq('id', quiz.id);
    await decrementQuizCount(supabase, quiz.publisher_id);
    onDeleted(quiz.id);
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{quiz.emoji}</span>
          <h3 className="font-heading font-semibold">{quiz.title}</h3>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            quiz.status === 'published'
              ? 'bg-green/20 text-green'
              : 'bg-border text-gray-400'
          }`}
        >
          {quiz.status === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>

      {quiz.source_url && (
        <p className="text-xs text-gray-500 truncate mb-2">{quiz.source_url}</p>
      )}

      <p className="text-sm text-gray-400 mb-4">{quiz.attempt_count} attempts</p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <a
          href={`/q/${username}/${quiz.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-md border border-border hover:border-accent transition-colors"
        >
          View
        </a>
        <button
          disabled
          title="Editing is coming soon"
          className="px-3 py-1.5 rounded-md border border-border opacity-40 cursor-not-allowed"
        >
          Edit
        </button>
        <button
          onClick={handleShare}
          className="px-3 py-1.5 rounded-md border border-border hover:border-accent transition-colors"
        >
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="px-3 py-1.5 rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Delete
        </button>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
            <h3 className="font-heading text-lg font-semibold mb-2">Delete this quiz?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This permanently deletes &quot;{quiz.title}&quot; and its attempt history.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-md bg-red-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors"
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
