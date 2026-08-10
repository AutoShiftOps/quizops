'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { PublishedQuiz, Question } from '@/lib/types';
import QuestionEditor from '@/components/QuestionEditor';
import QuizMetadataForm from '@/components/QuizMetadataForm';

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
  const [sourceUrl, setSourceUrl] = useState('');
  const [topic, setTopic] = useState('');
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
      setTopic(found.topic ?? '');
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
    if (questions.length <= 1) return;
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

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    markDirty();
  }

  function handleMoveDown(index: number) {
    setQuestions((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
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
        topic: topic || undefined,
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
            topic: topic || null,
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
    } else {
      const json = await res.json().catch(() => ({}));
      setSaveError(json.message || 'Could not update status.');
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

  const belowMinimum = questions.length < 3;

  return (
    <div className="max-w-2xl mx-auto px-6 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold">Edit quiz</h1>
          {quiz.status === 'draft' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
              Draft
            </span>
          )}
        </div>
        {dirty && <span className="text-xs text-amber-400">● Unsaved changes</span>}
      </div>
      <p className="text-xs text-gray-500 -mt-6 mb-8">
        Last updated: {relativeTime(quiz.updated_at)}
      </p>

      <div className="mb-6">
        <QuizMetadataForm
          title={title}
          onTitleChange={(v) => {
            setTitle(v);
            markDirty();
          }}
          titleTouched={titleTouched}
          onTitleBlur={() => setTitleTouched(true)}
          description={description}
          onDescriptionChange={(v) => {
            setDescription(v);
            markDirty();
          }}
          emoji={emoji}
          onEmojiChange={(v) => {
            setEmoji(v);
            markDirty();
          }}
          sourceUrl={sourceUrl}
          onSourceUrlChange={(v) => {
            setSourceUrl(v);
            markDirty();
          }}
          topic={topic}
          onTopicChange={(v) => {
            setTopic(v);
            markDirty();
          }}
          durationMin={durationMin}
          onDurationChange={(v) => {
            setDurationMin(v);
            markDirty();
          }}
          passMark={passMark}
          onPassMarkChange={(v) => {
            setPassMark(v);
            markDirty();
          }}
        />
      </div>

      {quiz.status === 'draft' && belowMinimum && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Add at least 3 questions to publish. Each question needs 4 options and one correct
          answer marked.
        </div>
      )}

      <div className="space-y-4 mb-6">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id ?? i}
            question={q}
            index={i}
            onChange={(updated) => handleQuestionChange(i, updated)}
            onDelete={() => handleQuestionDelete(i)}
            canDelete={questions.length > 1}
            onMoveUp={() => handleMoveUp(i)}
            onMoveDown={() => handleMoveDown(i)}
            isFirst={i === 0}
            isLast={i === questions.length - 1}
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
            disabled={togglingStatus || (quiz.status === 'draft' && belowMinimum)}
            title={
              quiz.status === 'draft' && belowMinimum
                ? 'Add at least 3 questions to publish'
                : undefined
            }
            className="px-4 py-2.5 rounded-md border border-border hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {togglingStatus
              ? 'Working…'
              : quiz.status === 'published'
              ? 'Unpublish'
              : 'Publish'}
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
