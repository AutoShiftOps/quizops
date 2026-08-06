'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher } from '@/lib/publisher';
import { Publisher, Question } from '@/lib/types';
import QuestionEditor from '@/components/QuestionEditor';
import QuizMetadataForm from '@/components/QuizMetadataForm';
import SharePanel from '@/components/SharePanel';

type Step = 'select' | 'input' | 'generating' | 'review' | 'published';
type Mode = 'ai' | 'manual';

function blankQuestion(n: number): Question {
  return {
    id: `q${n}-${Date.now()}`,
    text: 'New question',
    code: null,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 0,
    explanation: '',
    tags: [],
  };
}

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

  const [step, setStep] = useState<Step>('select');
  const [mode, setMode] = useState<Mode>('ai');

  // Input step (AI path only)
  const [url, setUrl] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [inputError, setInputError] = useState<string | null>(null);

  // Generating step (AI path only)
  const [questions, setQuestions] = useState<Question[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Review step metadata (shared by both paths)
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [sourceUrl, setSourceUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [durationMin, setDurationMin] = useState(10);
  const [passMark, setPassMark] = useState(70);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
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

  function resetMetadata() {
    setTitle('');
    setTitleTouched(false);
    setDescription('');
    setEmoji('📝');
    setSourceUrl('');
    setTopic('');
    setDurationMin(10);
    setPassMark(70);
    setPublishError(null);
    setShareData(null);
  }

  function resetToSelect() {
    setStep('select');
    setMode('ai');
    setUrl('');
    setShowPasteArea(false);
    setPastedText('');
    setQuestionCount(10);
    setInputError(null);
    setQuestions([]);
    resetMetadata();
  }

  function handleSelectAi() {
    setMode('ai');
    setStep('input');
  }

  function handleSelectManual() {
    setMode('manual');
    resetMetadata();
    setQuestions([blankQuestion(1)]);
    setStep('review');
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
            const parsed = JSON.parse(line);
            if (parsed.__meta__) {
              if (parsed.title) setTitle(parsed.title);
              continue;
            }
            setQuestions((prev) => [...prev, parsed]);
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
    resetToSelect();
  }

  function handleQuestionChange(index: number, updated: Question) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  }

  function handleQuestionDelete(index: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddQuestion() {
    setQuestions((prev) => [...prev, blankQuestion(prev.length + 1)]);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function handleMoveDown(index: number) {
    setQuestions((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function submitQuiz(status: 'draft' | 'published') {
    if (!title.trim()) {
      setTitleTouched(true);
      return;
    }
    if (status === 'published') setPublishing(true);
    else setSavingDraft(true);
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
        topic: topic || undefined,
        duration_s: durationMin * 60,
        pass_mark: passMark,
        questions,
        status,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setPublishError(json.message || 'Could not save quiz. Please try again.');
      setPublishing(false);
      setSavingDraft(false);
      return;
    }

    if (status === 'draft') {
      router.push('/dashboard');
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

  if (step === 'published' && shareData) {
    return (
      <SharePanel
        url={shareData.url}
        embedHtml={shareData.embedHtml}
        badgeMarkdown={shareData.badgeMarkdown}
        onCreateAnother={resetToSelect}
      />
    );
  }

  if (step === 'select') {
    return (
      <div className="mt-8 max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-semibold mb-1">Create a quiz</h1>
        <p className="text-gray-400 mb-6">
          Choose how you want to build it — generate from your article or write questions
          yourself.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleSelectAi}
            className="text-left p-6 rounded-xl border-2 border-accent bg-accent/10 transition-colors"
          >
            <span className="text-2xl text-accent">✨</span>
            <h2 className="font-heading font-semibold mt-3 mb-1">Generate from article</h2>
            <p className="text-sm text-gray-400 mb-4">
              Paste your article URL or text. AI writes 10 questions in under 60 seconds.
              Review and edit before publishing.
            </p>
            <span className="text-xs font-semibold text-accent">Recommended</span>
          </button>
          <button
            onClick={handleSelectManual}
            className="text-left p-6 rounded-xl border border-border hover:border-green transition-colors"
          >
            <span className="text-2xl text-green">✎</span>
            <h2 className="font-heading font-semibold mt-3 mb-1">Write questions manually</h2>
            <p className="text-sm text-gray-400 mb-4">
              Start with a blank quiz. Add your own questions, options, and explanations at
              your own pace.
            </p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green/10 text-green">
              Full control
            </span>
          </button>
        </div>
      </div>
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
    const belowMinimum = questions.length < 3;

    return (
      <div className="mt-8 max-w-2xl mx-auto">
        <h1 className="font-heading text-xl font-semibold mb-6">
          {mode === 'manual' ? 'Write your quiz' : 'Review your quiz'}
        </h1>

        <div className="mb-6">
          <QuizMetadataForm
            title={title}
            onTitleChange={setTitle}
            titleTouched={titleTouched}
            onTitleBlur={() => setTitleTouched(true)}
            description={description}
            onDescriptionChange={setDescription}
            emoji={emoji}
            onEmojiChange={setEmoji}
            sourceUrl={sourceUrl}
            onSourceUrlChange={setSourceUrl}
            topic={topic}
            onTopicChange={setTopic}
            durationMin={durationMin}
            onDurationChange={setDurationMin}
            passMark={passMark}
            onPassMarkChange={setPassMark}
          />
        </div>

        <p className="text-center text-sm text-gray-500 mb-4">
          questions ({questions.length} of minimum 3)
        </p>

        {belowMinimum && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Add at least 3 questions to publish. Each question needs 4 options and one
            correct answer marked.
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
              startInEditMode={q.text === 'New question' && q.explanation === ''}
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <div className="flex gap-2">
            {mode === 'manual' ? (
              <button
                onClick={resetToSelect}
                className="px-4 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
              >
                ← Back
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => submitQuiz('draft')}
              disabled={savingDraft || publishing || questions.length < 1 || !title.trim()}
              className="px-4 py-2.5 rounded-md border border-border hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {savingDraft ? 'Saving…' : 'Save draft'}
            </button>
            <button
              onClick={() => submitQuiz('published')}
              disabled={publishing || savingDraft || questions.length < 3 || !title.trim()}
              className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {publishing ? 'Publishing…' : 'Publish quiz →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'input' (AI path)
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

      <div className="flex items-center gap-2">
        <button
          onClick={resetToSelect}
          className="px-4 py-2.5 rounded-md border border-border hover:border-accent transition-colors text-sm"
        >
          ← Back
        </button>
        <button
          onClick={handleGenerateClick}
          className="flex-1 px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          Generate quiz →
        </button>
      </div>
    </div>
  );
}
