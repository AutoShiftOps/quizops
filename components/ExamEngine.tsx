'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { clearExamProgress, loadExamProgress, saveExamProgress } from '@/lib/examStorage';
import { QuizBank, Question } from '@/lib/types';
import ExamStartScreen from './ExamStartScreen';
import ExamProctor from './ExamProctor';
import ExamResultsScreen from './ExamResultsScreen';

type Props = {
  bank: QuizBank;
  questions: Question[];
};

type Phase = 'start' | 'exam' | 'results';
type SubmitStep = null | 'flagged' | 'unanswered' | 'confirm';
type AutoSubmitReason = 'time' | 'violations' | null;

function timerClasses(timeLeft: number, duration: number): string {
  const pct = timeLeft / duration;
  if (pct <= 0.1) return 'text-red-500 font-semibold animate-pulse';
  if (pct <= 0.25) return 'text-orange-500 font-semibold';
  if (pct <= 0.5) return 'text-amber-400 font-semibold';
  return 'text-gray-400';
}

function dotClasses(isAnswered: boolean, isFlagged: boolean): string {
  if (isAnswered && isFlagged) return 'bg-green text-white';
  if (isFlagged) return 'bg-orange-500 text-white';
  if (isAnswered) return 'bg-accent text-white';
  return 'bg-border text-gray-400';
}

export default function ExamEngine({ bank, questions }: Props) {
  const total = questions.length;

  const [phase, setPhase] = useState<Phase>('start');
  const [user, setUser] = useState<User | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [flagged, setFlagged] = useState<boolean[]>(() => Array(total).fill(false));
  const [timeLeft, setTimeLeft] = useState(bank.duration_seconds);
  const [violationCount, setViolationCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [ready, setReady] = useState(false);
  const [autoSubmitReason, setAutoSubmitReason] = useState<AutoSubmitReason>(null);
  const [submitStep, setSubmitStep] = useState<SubmitStep>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    getSupabaseClient()
      .then(async (supabase) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      })
      .catch(() => {});
  }, []);

  // Restore a mid-exam checkpoint (if any) after mount, so the server-rendered
  // fresh state always matches the first client render and avoids a hydration
  // mismatch. Applied immediately, but the exam still opens on the start
  // screen — fullscreen requires a fresh user gesture after a reload anyway.
  useEffect(() => {
    const saved = loadExamProgress(bank.slug);
    if (saved) {
      setCurrentIndex(Math.min(Math.max(saved.current, 0), total - 1));
      setSelected(saved.selected.length === total ? saved.selected : Array(total).fill(null));
      setFlagged(saved.flagged.length === total ? saved.flagged : Array(total).fill(false));
      setTimeLeft(Math.min(Math.max(saved.timeLeft, 0), bank.duration_seconds));
      setViolationCount(saved.violationCount ?? 0);
      setResuming(true);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist a checkpoint on every meaningful change, once the exam is
  // underway. A checkpoint with no progress yet isn't worth resuming, so
  // keep the key absent — otherwise "Retake Exam" would immediately recreate
  // an empty checkpoint on the very next render.
  useEffect(() => {
    if (!ready || phase !== 'exam') return;
    const hasProgress =
      currentIndex > 0 || selected.some((s) => s !== null) || flagged.some(Boolean);
    if (!hasProgress) {
      clearExamProgress(bank.slug);
      return;
    }
    saveExamProgress(bank.slug, {
      current: currentIndex,
      selected,
      flagged,
      timeLeft,
      violationCount,
    });
  }, [ready, phase, currentIndex, selected, flagged, timeLeft, violationCount, bank.slug]);

  const finishExam = useCallback(
    (reason: 'submit' | 'time' | 'violations') => {
      clearExamProgress(bank.slug);
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setAutoSubmitReason(reason === 'submit' ? null : reason);
      setPhase('results');
    },
    [bank.slug]
  );

  useEffect(() => {
    if (phase !== 'exam' || paused) return;
    if (timeLeft <= 0) {
      finishExam('time');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, phase, paused, finishExam]);

  function handleStart() {
    setPhase('exam');
  }

  function handleRetake() {
    clearExamProgress(bank.slug);
    setCurrentIndex(0);
    setSelected(Array(total).fill(null));
    setFlagged(Array(total).fill(false));
    setTimeLeft(bank.duration_seconds);
    setViolationCount(0);
    setResuming(false);
    setAutoSubmitReason(null);
    setSubmitStep(null);
    setPhase('start');
  }

  function handleSelect(optionIndex: number) {
    setSelected((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  }

  function handleToggleFlag() {
    setFlagged((prev) => {
      const next = [...prev];
      next[currentIndex] = !next[currentIndex];
      return next;
    });
  }

  function goTo(index: number) {
    setCurrentIndex(Math.min(Math.max(index, 0), total - 1));
    setMobilePanelOpen(false);
  }

  const flaggedIndices = flagged.map((f, i) => (f ? i : -1)).filter((i) => i >= 0);
  const unansweredIndices = selected.map((s, i) => (s === null ? i : -1)).filter((i) => i >= 0);

  function handleSubmitClick() {
    if (flaggedIndices.length > 0) setSubmitStep('flagged');
    else if (unansweredIndices.length > 0) setSubmitStep('unanswered');
    else setSubmitStep('confirm');
  }

  function handleProceedFromFlagged() {
    if (unansweredIndices.length > 0) setSubmitStep('unanswered');
    else setSubmitStep('confirm');
  }

  if (phase === 'start') {
    return <ExamStartScreen bank={bank} resuming={resuming} onStart={handleStart} />;
  }

  if (phase === 'results') {
    return (
      <ExamResultsScreen
        bank={bank}
        questions={questions}
        selected={selected}
        flagged={flagged}
        timeTakenS={bank.duration_seconds - Math.max(timeLeft, 0)}
        violationCount={violationCount}
        autoSubmitReason={autoSubmitReason}
        user={user}
        onRetake={handleRetake}
      />
    );
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const isFlagged = flagged[currentIndex];
  const isSelected = selected[currentIndex];

  const panelGrid = (
    <div>
      <div className="grid grid-cols-5 md:grid-cols-4 gap-2 mb-4">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => goTo(i)}
            className={`h-9 rounded-md text-sm font-medium transition-colors ${dotClasses(
              selected[i] !== null,
              flagged[i]
            )} ${i === currentIndex ? 'ring-2 ring-white' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="space-y-1 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-border inline-block" /> Unanswered
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-accent inline-block" /> Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-500 inline-block" /> Flagged
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green inline-block" /> Answered + flagged
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      {phase === 'exam' && (
        <ExamProctor
          violationCount={violationCount}
          onViolation={() => setViolationCount((c) => c + 1)}
          onAutoSubmit={() => finishExam('violations')}
          onPauseChange={setPaused}
        />
      )}

      {resuming && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          Resuming your previous exam session
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMobilePanelOpen((v) => !v)}
          className="md:hidden text-sm px-3 py-1.5 rounded-md border border-border"
        >
          Question {currentIndex + 1} of {total} · Menu
        </button>
        <div className="hidden md:block text-sm text-gray-400">
          Question {currentIndex + 1} of {total}
          {violationCount > 0 && (
            <span className="ml-3 text-amber-400">
              ⚠️ {violationCount} warning{violationCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <span className={timerClasses(timeLeft, bank.duration_seconds)}>
          {minutes}:{seconds}
        </span>
      </div>

      {mobilePanelOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-surface border-t border-border p-4 rounded-t-xl max-h-[70vh] overflow-y-auto">
          {panelGrid}
        </div>
      )}

      <div className="flex gap-6">
        <aside className="hidden md:block w-48 shrink-0">
          <div className="sticky top-6 bg-surface border border-border rounded-xl p-4">
            {panelGrid}
          </div>
        </aside>

        <div className="flex-1 bg-surface border border-border rounded-xl p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="font-heading text-lg font-semibold">{currentQuestion.text}</h2>
            <button
              onClick={handleToggleFlag}
              title="Flag for review"
              className={`shrink-0 text-lg ${isFlagged ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              🚩
            </button>
          </div>

          {currentQuestion.code && (
            <pre className="bg-background border border-border rounded-lg p-4 mb-4 overflow-x-auto text-sm">
              <code>{currentQuestion.code}</code>
            </pre>
          )}

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  isSelected === i
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-md border border-border hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={handleSubmitClick}
              className="px-4 py-2 rounded-md border border-accent text-accent hover:bg-accent/10 transition-colors text-sm"
            >
              Submit Exam
            </button>

            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === total - 1}
              className="px-4 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {submitStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
            {submitStep === 'flagged' && (
              <>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  You have {flaggedIndices.length} flagged question
                  {flaggedIndices.length === 1 ? '' : 's'}
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  Review them before submitting?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      goTo(flaggedIndices[0]);
                      setSubmitStep(null);
                    }}
                    className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Review flagged
                  </button>
                  <button
                    onClick={handleProceedFromFlagged}
                    className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors"
                  >
                    Submit anyway
                  </button>
                </div>
              </>
            )}

            {submitStep === 'unanswered' && (
              <>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {unansweredIndices.length} question
                  {unansweredIndices.length === 1 ? '' : 's'} unanswered
                </h3>
                <p className="text-sm text-gray-400 mb-6">Submit anyway?</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      goTo(unansweredIndices[0]);
                      setSubmitStep(null);
                    }}
                    className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors"
                  >
                    Go back
                  </button>
                  <button
                    onClick={() => setSubmitStep('confirm')}
                    className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Submit anyway
                  </button>
                </div>
              </>
            )}

            {submitStep === 'confirm' && (
              <>
                <h3 className="font-heading text-lg font-semibold mb-2">Submit exam?</h3>
                <p className="text-sm text-gray-400 mb-6">
                  You won&apos;t be able to change your answers after this.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => finishExam('submit')}
                    className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setSubmitStep(null)}
                    className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
