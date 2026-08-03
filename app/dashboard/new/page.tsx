'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher, checkTierLimit } from '@/lib/publisher';
import { Publisher, Question } from '@/lib/types';
import QuestionEditor from '@/components/QuestionEditor';
import SharePanel from '@/components/SharePanel';

type Step = 'input' | 'generating' | 'review' | 'published';

const EMOJI_OPTIONS = [
  '📝', '🚀', '💡', '🔧', '🛠️', '📦', '☁️', '🔒',
  '🐳', '⚙️', '📊', '🧪', '🎯', '🔥', '⚡', '🌐',
  '🧠', '📚', '✅', '💻',
];

async function authHeader(): Promise<Record<string, string>> {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ''}` };
}

export default function NewQuizPage() {
  const router = useRouter();
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [loadingPublisher, setLoadingPublisher] = useState(true);

  const [step, setStep] = useState<Step>('input');

  // Input step
  const [url, setUrl] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [inputError, setInputError] = useState<string | null>(null);

  // Generating step
  const [questions, setQuestions] = useState<Question[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Review step metadata
  const [title, setTitle] = useState('Untitled Quiz');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [durationMin, setDurationMin] = useState(10);
  const [passMark, setPassMark] = useState(70);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Published step
  const [shareData, setShareData] = useState<{
    url: string;
    embedHtml: string;
    badgeMarkdown: string;
  } | null>(null);

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
      const pub = await getPublisher(supabase, session.user.id);
      if (!pub) {
        router.replace('/dashboard');
        return;
      }
      setPublisher(pub);
      setLoadingPublisher(false);
    })().catch(() => setLoadingPublisher(false));
  }, [router]);

  function resetToInput() {
    setStep('input');
    setUrl('');
    setShowPasteArea(false);
    setPastedText('');
    setQuestionCount(10);
    setInputError(null);
    setQuestions([]);
    setTitle('Untitled Quiz');
    setDescription('');
    setEmoji('📝');
    setSourceUrl('');
    setDurationMin(10);
    setPassMark(70);
    setPublishError(null);
    setShareData(null);
  }

  async function startGeneration(payload: { url?: string; text?: string }) {
    setInputError(null);
    setQuestions([]);
    setStep('generating');

    const headers = await authHeader();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let response: Response;
    try {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ ...payload, questionCount }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStep('input');
        return;
      }
      setInputError('Something went wrong. Please try again.');
      setStep('input');
      return;
    }

    if (response.status === 422) {
      const json = await response.json().catch(() => ({}));
      setInputError(json.message || 'Could not fetch that URL');
      setShowPasteArea(true);
      setStep('input');
      return;
    }

    if (!response.ok || !response.body) {
      const json = await response.json().catch(() => ({}));
      setInputError(json.message || 'Generation failed. Please try again.');
      setStep('input');
      return;
    }

    if (payload.url) setSourceUrl(payload.url);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const q = JSON.parse(line);
            setQuestions((prev) => [...prev, q]);
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setInputError('Generation was interrupted.');
      }
    }

    setStep('review');
  }

  function handleCancelGeneration() {
    abortControllerRef.current?.abort();
  }

  function handleGenerateClick() {
    if (showPasteArea) {
      if (!pastedText.trim()) {
        setInputError('Please paste some article text.');
        return;
      }
      startGeneration({ text: pastedText });
      return;
    }
    if (!url.trim()) {
      setInputError('Please enter a URL or paste article text.');
      return;
    }
    try {
      // eslint-disable-next-line no-new
      new URL(url.trim());
    } catch {
      setInputError('Please enter a valid URL.');
      return;
    }
    startGeneration({ url: url.trim() });
  }

  function handleRegenerate() {
    if (!window.confirm('This will clear all generated questions. Continue?')) return;
    if (sourceUrl) startGeneration({ url: sourceUrl });
    else startGeneration({ text: pastedText });
  }

  function handleStartOver() {
    if (!window.confirm('This will discard everything and start over. Continue?')) return;
    resetToInput();
  }

  function handleQuestionChange(index: number, updated: Question) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  }

  function handleQuestionDelete(index: number) {
    if (questions.length <= 3) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
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
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    const headers = await authHeader();

    const res = await fetch('/api/publish', {
      method: 'POST',
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
      setPublishError(json.message || 'Could not publish quiz. Please try again.');
      setPublishing(false);
      return;
    }

    const json = await res.json();
    setShareData(json);
    setStep('published');
    setPublishing(false);
  }

  if (loadingPublisher) {
    return <div className="mt-8 text-center text-gray-500">Loading…</div>;
  }

  if (!publisher) return null;

  const limitReached = checkTierLimit(publisher);

  if (limitReached && step === 'input') {
    return (
      <div className="mt-8 max-w-lg mx-auto text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="font-heading text-xl font-semibold mb-2">
          Free tier limit reached (3/3 quizzes)
        </h1>
        <p className="text-gray-400 mb-6">
          Upgrade to Pro for unlimited quizzes and generations.
        </p>
      </div>
    );
  }

  if (step === 'published' && shareData) {
    return (
      <SharePanel
        url={shareData.url}
        embedHtml={shareData.embedHtml}
        badgeMarkdown={shareData.badgeMarkdown}
        onCreateAnother={resetToInput}
      />
    );
  }

  if (step === 'generating') {
    return (
      <div className="mt-8 max-w-xl mx-auto">
        <h1 className="font-heading text-xl font-semibold mb-6 text-center">
          ✨ Generating your quiz...
        </h1>
        <div className="space-y-2 mb-6">
          {questions.map((q, i) => (
            <p key={q.id ?? i} className="text-sm animate-fade-in">
              ✓ Q{i + 1}: {q.text?.slice(0, 60)}
              {q.text?.length > 60 ? '…' : ''}
            </p>
          ))}
          {questions.length < questionCount && (
            <p className="text-sm text-gray-500 animate-pulse">
              ⟳ Generating Q{questions.length + 1}...
            </p>
          )}
        </div>
        <p className="text-sm text-gray-400 text-center mb-6">
          Generated {questions.length} of {questionCount} questions
        </p>
        <div className="text-center">
          <button
            onClick={handleCancelGeneration}
            className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="mt-8 max-w-2xl mx-auto">
        <h1 className="font-heading text-xl font-semibold mb-6">Review your quiz</h1>

        <div className="bg-surface border border-border rounded-xl p-5 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setSourceUrl(e.target.value)}
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
                  onClick={() => setDurationMin(min)}
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
                  onClick={() => setPassMark(mark)}
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

        {publishError && <p className="text-sm text-red-400 mb-4">{publishError}</p>}

        <div className="flex items-center justify-between border-t border-border pt-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">{questions.length} questions</p>
            <div className="flex gap-2">
              <button
                onClick={handleStartOver}
                className="px-4 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
              >
                ↺ Start over
              </button>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
              >
                ↺ Regenerate
              </button>
            </div>
          </div>
          <button
            onClick={handlePublish}
            disabled={publishing || questions.length < 3 || !title.trim()}
            className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {publishing ? 'Publishing…' : 'Publish quiz →'}
          </button>
        </div>
      </div>
    );
  }

  // step === 'input'
  return (
    <div className="mt-8 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-semibold mb-6 text-center">
        Create a quiz from your article
      </h1>

      {!showPasteArea && (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-article-url.com"
              className="flex-1 px-4 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
            />
          </div>
          <button
            onClick={() => setShowPasteArea(true)}
            className="text-xs text-accent hover:underline mb-6"
          >
            Paste text instead
          </button>
        </>
      )}

      {showPasteArea && (
        <>
          <div className="mb-2">
            <span className="text-sm text-gray-400">or</span>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder="Paste your article text here…"
            className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-accent outline-none resize-none mb-6"
          />
        </>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1.5">Number of questions</label>
        <div className="flex gap-2">
          {[5, 10, 15].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setQuestionCount(count)}
              className={`px-4 py-1.5 rounded-md border text-sm transition-colors ${
                questionCount === count
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border hover:border-accent'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {inputError && <p className="text-sm text-red-400 mb-4">{inputError}</p>}

      <button
        onClick={handleGenerateClick}
        className="w-full px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
      >
        Generate quiz →
      </button>
    </div>
  );
}
