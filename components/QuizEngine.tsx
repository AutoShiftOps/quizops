'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { clearCheckpoint, loadCheckpoint, saveCheckpoint } from '@/lib/quizStorage';
import { QuizBank, Question } from '@/lib/types';
import ResultsScreen from './ResultsScreen';

type Props = {
  bank: QuizBank;
  questions: Question[];
};

export default function QuizEngine({ bank, questions }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(bank.duration_seconds);
  const [finished, setFinished] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [ready, setReady] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCurrent = answers[currentQuestion.id] !== undefined;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    getSupabaseClient()
      .then(async (supabase) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // A one-time check on mount could miss a sign-in that completes
        // slightly later (e.g. right after an OAuth redirect lands here) —
        // without this, finishing the quiz before that resolves would save
        // the attempt as a guest (or not at all).
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setUser(newSession?.user ?? null);
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => {});
    return () => unsubscribe?.();
  }, []);

  // Restore a mid-quiz checkpoint (if any) after mount, so the server-rendered
  // fresh state always matches the first client render and avoids a hydration
  // mismatch.
  useEffect(() => {
    const checkpoint = loadCheckpoint(bank.slug);
    if (checkpoint) {
      const restoredAnswers: Record<string, number> = {};
      checkpoint.selected.forEach((value, i) => {
        const question = questions[i];
        if (question && checkpoint.revealed[i] && value !== null) {
          restoredAnswers[question.id] = value;
        }
      });

      setCurrentIndex(Math.min(Math.max(checkpoint.current, 0), questions.length - 1));
      setAnswers(restoredAnswers);
      setTimeLeft(Math.min(Math.max(checkpoint.timeLeft, 0), bank.duration_seconds));
      setResuming(true);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist a checkpoint on every meaningful change, once the initial
  // restore attempt has completed. A quiz with no progress yet (still on Q1,
  // nothing answered) has nothing worth resuming, so keep the key absent —
  // otherwise "Start fresh"/"Try again" would immediately recreate an empty
  // checkpoint on the very next render.
  useEffect(() => {
    if (!ready || finished) return;
    const hasProgress = currentIndex > 0 || Object.keys(answers).length > 0;
    if (!hasProgress) {
      clearCheckpoint(bank.slug);
      return;
    }
    saveCheckpoint(bank.slug, {
      current: currentIndex,
      selected: questions.map((q) => (answers[q.id] !== undefined ? answers[q.id] : null)),
      revealed: questions.map((q) => answers[q.id] !== undefined),
      timeLeft,
    });
  }, [ready, finished, currentIndex, answers, timeLeft, bank.slug, questions]);

  const finishQuiz = useCallback(() => {
    clearCheckpoint(bank.slug);
    setFinished(true);
  }, [bank.slug]);

  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      finishQuiz();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, finished, finishQuiz]);

  function handleSelect(optionIndex: number) {
    if (answeredCurrent) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  }

  function handleNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishQuiz();
    }
  }

  function handleStartFresh() {
    clearCheckpoint(bank.slug);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(bank.duration_seconds);
    setResuming(false);
  }

  function handleRetry() {
    clearCheckpoint(bank.slug);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(bank.duration_seconds);
    setResuming(false);
    setFinished(false);
  }

  if (finished) {
    return (
      <ResultsScreen
        bank={bank}
        questions={questions}
        answers={answers}
        timeTakenS={bank.duration_seconds - Math.max(timeLeft, 0)}
        user={user}
        onRetry={handleRetry}
      />
    );
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / questions.length) * 100;

  return (
    <div className="mt-8">
      {resuming && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <span>Resuming your previous session</span>
          <button
            onClick={handleStartFresh}
            className="text-accent underline hover:opacity-80 transition-opacity"
          >
            Start fresh
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
        <span>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className={timeLeft < 60 ? 'text-red-400 font-semibold' : ''}>
          {minutes}:{seconds}
        </span>
      </div>

      <div className="w-full h-2 bg-border rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {questions.map((q, i) => (
          <span
            key={q.id}
            className={`w-2.5 h-2.5 rounded-full ${
              answers[q.id] !== undefined
                ? 'bg-accent'
                : i === currentIndex
                ? 'bg-gray-400'
                : 'bg-border'
            }`}
          />
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">
          {currentQuestion.text}
        </h2>

        {currentQuestion.code && (
          <pre className="bg-background border border-border rounded-lg p-4 mb-4 overflow-x-auto text-sm">
            <code>{currentQuestion.code}</code>
          </pre>
        )}

        <div className="space-y-3">
          {currentQuestion.options.map((option, i) => {
            const isSelected = answers[currentQuestion.id] === i;
            const isCorrect = i === currentQuestion.answer;

            let optionClasses = 'border-border hover:border-accent';
            if (answeredCurrent) {
              if (isCorrect) optionClasses = 'border-green bg-green/10';
              else if (isSelected && !isCorrect)
                optionClasses = 'border-red-500 bg-red-500/10';
              else optionClasses = 'border-border opacity-60';
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answeredCurrent}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${optionClasses}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answeredCurrent && (
          <div className="mt-5 p-4 rounded-lg bg-background border border-border">
            <p className="text-sm text-gray-300">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {answeredCurrent && (
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
            >
              {currentIndex + 1 < questions.length ? 'Next question' : 'See results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
