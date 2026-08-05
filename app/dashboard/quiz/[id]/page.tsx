'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { PublishedQuiz, Question } from '@/lib/types';
import QuestionEditor from '@/components/QuestionEditor';

const EMOJI_OPTIONS = [
  '📝', '🚀', '💡', '🔧', '🛠️', '📦', '☁️', '🔒',
  '🐳', '⚙️', '📊', '🧪', '🎯', '🔥', '⚡', '🌐',
  '🧠', '📚', '✅', '💻',
];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function authHeader(): Promise<Record<string, string>> {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ''}` };
}

export default function EditQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const quizId = params.id;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<PublishedQuiz | null>(null);

  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [durationMin, setDurationMin] = useState(10);
  const [passMark, setPassMark] = useState(70);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

      const { data } = await supabase
        .from('published_quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      const found = data as PublishedQuiz | null;
      if (!found || found.publisher_id !== session.user.id) {
        router.replace('/dashboard');
        return;
      }

      setQuiz(found);
      setTitle(found.title);
      setDescription(found.description ?? '');
      setEmoji(found.emoji);
      setSourceUrl(found.source_url ?? '');
      setDurationMin(Math.round(found.duration_s / 60));
      setPassMark(found.pass_mark);
      setQuestions(found.questions);
      setLoading(false);
    })().catch(() => router.replace('/dashboard'));
  }, [quizId, router]);

  function markDirty() {
    setDirty(true);
  }

  function handleQuestionChange(index: number, updated: Question) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
    markDirty();
  }

  function handleQuestionDelete(index: number) {
    if (questions.length <= 3) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  }

  function handleAddQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q${prev.length + 1}-${Date.now()}`,
        text: 'New question',
        code: null,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 0,
        explanation: '',
        tags: [],
      },
    ]);
    markDirty();
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleTouched(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const headers = await authHeader();

    const res = await fetch(`/api/quiz/${quizId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        title,
        description: description || undefined,
        emoji,
        source_url: sourceUrl || undefined,
        duration_s: durationMin * 60,
        pass_mark: passMark,
        questions,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setSaveError(json.message || 'Could not save changes. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setDirty(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    setQuiz((prev) =>
      prev
        ? {
            ...prev,
            title,
            description: description || null,
            emoji,
            source_url: sourceUrl || null,
            duration_s: durationMin * 60,
            pass_mark: passMark,
            questions,
            updated_at: new Date().toISOString(),
          }
        : prev
    );
  }

  async function handleToggleStatus() {
    if (!quiz) return;
    setTogglingStatus(true);
    const newStatus = quiz.status === 'published' ? 'draft' : 'published';
    const headers = await authHeader();

    const res = await fetch(`/api/quiz/${quizId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setQuiz((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
    setTogglingStatus(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const headers = await authHeader();
    await fetch(`/api/quiz/${quizId}`, { method: 'DELETE', headers });
    router.push('/dashboard');
  }

  if (loading) {
    return <div className="mt-8 text-center text-gray-500">Loading…</div>;
  }

  if (!quiz) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 mt-8">
      <Link
        href="/dashboard"
        className="text-sm text-gray-400 hover:text-accent transition-colors"
      >
        ← Back to dashboard
      </Link>

      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <h1 className="font-heading text-xl font-semibold">Edit quiz</h1>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {relativeTime(quiz.updated_at)}
          </p>
        </div>
        {dirty && <span className="text-xs text-amber-400">● Unsaved changes</span>}
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            onBlur={() => setTitleTouched(true)}
            maxLength={100}
            className={`w-full px-3 py-2 rounded-md bg-background border outline-none ${
              titleTouched && !title.trim()
                ? 'border-red-500'
                : 'border-border focus:border-accent'
            }`}
          />
          {titleTouched && !title.trim() && (
            <p className="text-xs text-red-400 mt-1.5">Title is required.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            rows={2}
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Emoji</label>
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="text-2xl px-3 py-1.5 rounded-md border border-border hover:border-accent transition-colors"
          >
            {emoji}
          </button>
          {showEmojiPicker && (
            <div className="grid grid-cols-10 gap-1 mt-2 p-3 rounded-md border border-border bg-background">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    setEmoji(e);
                    setShowEmojiPicker(false);
                    markDirty();
                  }}
                  className="text-xl hover:bg-surface rounded p-1"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Source URL</label>
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => {
              setSourceUrl(e.target.value);
              markDirty();
            }}
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Duration</label>
          <div className="flex gap-2">
            {[10, 20, 30].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => {
                  setDurationMin(min);
                  markDirty();
                }}
                className={`px-4 py-1.5 rounded-md border text-sm transition-colors ${
                  durationMin === min
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border hover:border-accent'
                }`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Pass mark</label>
          <div className="flex gap-2">
            {[60, 70, 80].map((mark) => (
              <button
                key={mark}
                type="button"
                onClick={() => {
                  setPassMark(mark);
                  markDirty();
                }}
                className={`px-4 py-1.5 rounded-md border text-sm transition-colors ${
                  passMark === mark
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border hover:border-accent'
                }`}
              >
                {mark}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id ?? i}
            question={q}
            index={i}
            onChange={(updated) => handleQuestionChange(i, updated)}
            onDelete={() => handleQuestionDelete(i)}
            canDelete={questions.length > 3}
          />
        ))}
      </div>

      <button
        onClick={handleAddQuestion}
        className="w-full mb-8 px-4 py-2 rounded-md border border-dashed border-border hover:border-accent transition-colors text-sm text-gray-400"
      >
        + Add question
      </button>

      {saveError && <p className="text-sm text-red-400 mb-4">{saveError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="px-4 py-2.5 rounded-md border border-border hover:border-accent transition-colors disabled:opacity-50"
          >
            {togglingStatus
              ? 'Working…'
              : quiz.status === 'published'
              ? 'Unpublish'
              : 'Republish'}
          </button>
        </div>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="px-4 py-2.5 rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Delete quiz
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green text-background px-4 py-2.5 rounded-md shadow-lg text-sm font-medium">
          ✓ Changes saved
        </div>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
            <h3 className="font-heading text-lg font-semibold mb-2">Delete this quiz?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This cannot be undone. All {quiz.attempt_count} attempts will also be
              deleted.
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
