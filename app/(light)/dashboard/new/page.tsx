'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher, checkTierLimit } from '@/lib/publisher';
import { Publisher, Question } from '@/lib/types';
import { track } from '@/lib/analytics';
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
  const [upgradeToast, setUpgradeToast] = useState(false);
  const [moderationError, setModerationError] = useState<{ message: string; reason?: string } | null>(
    null
  );

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

  useEffect(() => {
    track('quiz_create_started');
  }, []);

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
    setModerationError(null);
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
      if (json.error === 'content_not_allowed' || json.error === 'content_not_appropriate') {
        track('content_blocked', { reason: json.reason || 'unspecified' });
        setModerationError({
          message: json.message || "This content isn't eligible for quiz generation.",
          reason: json.reason,
        });
        setStep('input');
        return;
      }
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
    // Tracked locally rather than read from `questions.length` afterwards —
    // state updates inside this loop are async, so the outer closure's view
    // of `questions` isn't reliably caught up by the time we're done here.
    let receivedCount = 0;

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
            receivedCount += 1;
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

    track('quiz_generation_completed', { question_count: receivedCount });
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
      track('quiz_generation_started', { source: 'text' });
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
    track('quiz_generation_started', { source: 'url' });
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
    // /api/publish doesn't return a raw slug field, just the full public
    // URL — the slug is its last path segment.
    const publishedSlug = json.url?.split('/').filter(Boolean).pop();
    track('quiz_published', { bank_slug: publishedSlug ?? 'unknown' });
    // Keep the locally-held publisher in sync so the tier-limit gate below
    // re-evaluates correctly if they stay on this page (e.g. "Create
    // another quiz") right after publishing their 3rd free quiz.
    setPublisher((prev) => (prev ? { ...prev, quiz_count: prev.quiz_count + 1 } : prev));
  }

  if (loadingPublisher) {
    return <div className="mt-8 text-center text-[#71717A]">Loading…</div>;
  }

  if (!publisher) return null;

  // Show the just-published share screen before the gate check runs — a
  // publish that pushed them to the limit should still land on their share
  // links, not get clobbered by the wall. The wall only applies to
  // (re-)entering the create flow itself.
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

  // Hard gate: even a direct URL visit to /dashboard/new must hit this wall
  // when the free tier limit is reached — the API already rejects publishes
  // past the limit, but the UI shouldn't let someone reach the create flow
  // at all in that state. No "back to dashboard" link here (M1-01 removed
  // it) — the navbar avatar is the way back.
  if (checkTierLimit(publisher)) {
    return (
      <div className="mt-16 max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 text-warning flex items-center justify-center text-3xl mb-6">
          🔒
        </div>
        <h1 className="font-heading text-xl font-semibold mb-2 text-[#18181B]">
          Free tier limit reached
        </h1>
        <p className="text-sm text-[#71717A] mb-8">
          You&apos;ve published 3 of 3 free quizzes. Upgrade to Pro for unlimited
          quizzes, advanced analytics, and more.
        </p>
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              setUpgradeToast(true);
              setTimeout(() => setUpgradeToast(false), 3000);
            }}
            className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Upgrade to Pro →
          </button>
        </div>
        {upgradeToast && (
          <div className="fixed bottom-6 right-6 bg-white border border-[#E4E4E7] px-4 py-2.5 rounded-md shadow-lg text-sm text-[#18181B]">
            Pro tier coming soon! We&apos;ll notify you when it&apos;s available.
          </div>
        )}
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className="mt-8 max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-semibold mb-1 text-[#18181B]">Create a quiz</h1>
        <p className="text-[#71717A] mb-6">
          Choose how you want to build it — generate from your article or write questions
          yourself.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleSelectAi}
            className="text-left p-6 rounded-xl border-2 border-accent bg-accent/5 transition-colors"
          >
            <span className="text-2xl text-accent">✨</span>
            <h2 className="font-heading font-semibold mt-3 mb-1 text-[#18181B]">
              Generate from article
            </h2>
            <p className="text-sm text-[#71717A] mb-4">
              Paste your article URL or text. AI writes 10 questions in under 60 seconds.
              Review and edit before publishing.
            </p>
            <span className="text-xs font-semibold text-accent">Recommended</span>
          </button>
          <button
            onClick={handleSelectManual}
            className="text-left p-6 rounded-xl border border-[#E4E4E7] bg-white hover:border-success transition-colors"
          >
            <span className="text-2xl text-success">✎</span>
            <h2 className="font-heading font-semibold mt-3 mb-1 text-[#18181B]">
              Write questions manually
            </h2>
            <p className="text-sm text-[#71717A] mb-4">
              Start with a blank quiz. Add your own questions, options, and explanations at
              your own pace.
            </p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
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
        <h1 className="font-heading text-xl font-semibold mb-6 text-center text-[#18181B]">
          ✨ Generating your quiz...
        </h1>
        <div className="space-y-2 mb-6">
          {questions.map((q, i) => (
            <p key={q.id ?? i} className="text-sm text-[#18181B] animate-fade-in">
              ✓ Q{i + 1}: {q.text?.slice(0, 60)}
              {q.text?.length > 60 ? '…' : ''}
            </p>
          ))}
          {questions.length < questionCount && (
            <p className="text-sm text-[#71717A] animate-pulse">
              ⟳ Generating Q{questions.length + 1}...
            </p>
          )}
        </div>
        <p className="text-sm text-[#71717A] text-center mb-6">
          Generated {questions.length} of {questionCount} questions
        </p>
        <div className="text-center">
          <button
            onClick={handleCancelGeneration}
            className="px-5 py-2 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors text-sm"
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
        <h1 className="font-heading text-xl font-semibold mb-6 text-[#18181B]">
          {mode === 'manual' ? 'Write your quiz' : 'Review your quiz'}
        </h1>

        <div className="mb-6">
          <QuizMetadataForm
            theme="light"
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

        <p className="text-center text-sm text-[#71717A] mb-4">
          questions ({questions.length} of minimum 3)
        </p>

        {belowMinimum && (
          <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            Add at least 3 questions to publish. Each question needs 4 options and one
            correct answer marked.
          </div>
        )}

        <div className="space-y-4 mb-6">
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id ?? i}
              theme="light"
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
          className="w-full mb-8 px-4 py-2 rounded-md border border-dashed border-[#D4D4D8] hover:border-accent transition-colors text-sm text-[#71717A]"
        >
          + Add question
        </button>

        {publishError && <p className="text-sm text-danger mb-4">{publishError}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E4E7] pt-6">
          <div className="flex gap-2">
            {mode === 'manual' ? (
              <button
                onClick={resetToSelect}
                className="px-4 py-2 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors text-sm"
              >
                ← Back
              </button>
            ) : (
              <>
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors text-sm"
                >
                  ↺ Start over
                </button>
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors text-sm"
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
              className="px-4 py-2.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
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
      <h1 className="font-heading text-2xl font-semibold mb-6 text-center text-[#18181B]">
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
              className="flex-1 px-4 py-2 rounded-md bg-white border border-[#E4E4E7] focus:border-accent outline-none text-[#18181B]"
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
            <span className="text-sm text-[#71717A]">or</span>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder="Paste your article text here…"
            className="w-full px-4 py-2 rounded-md bg-white border border-[#E4E4E7] focus:border-accent outline-none resize-none mb-6 text-[#18181B]"
          />
        </>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1.5 text-[#18181B]">
          Number of questions
        </label>
        <div className="flex gap-2">
          {[5, 10, 15].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setQuestionCount(count)}
              className={`px-4 py-1.5 rounded-md border text-sm transition-colors ${
                questionCount === count
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8]'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {moderationError && (
        <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
          <p className="font-semibold text-danger mb-1">🚫 Content not allowed</p>
          <p className="text-[#18181B] mb-1">{moderationError.message}</p>
          {moderationError.reason && (
            <p className="text-[#71717A] mb-2">Reason: {moderationError.reason}</p>
          )}
          <p className="text-[#71717A] mb-3">
            QuizOps supports educational and technical content only.
          </p>
          <button
            onClick={() => {
              setModerationError(null);
              setUrl('');
            }}
            className="px-3 py-1.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors text-sm"
          >
            Try a different URL
          </button>
        </div>
      )}

      {inputError && <p className="text-sm text-danger mb-4">{inputError}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={resetToSelect}
          className="px-4 py-2.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors text-sm"
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
