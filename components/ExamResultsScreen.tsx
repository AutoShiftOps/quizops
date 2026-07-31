'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { saveExamAttempt } from '@/lib/supabase';
import { QuizBank, Question } from '@/lib/types';

type Props = {
  bank: QuizBank;
  questions: Question[];
  selected: (number | null)[];
  flagged: boolean[];
  timeTakenS: number;
  violationCount: number;
  autoSubmitReason: 'time' | 'violations' | null;
  user: User | null;
  onRetake: () => void;
};

export default function ExamResultsScreen({
  bank,
  questions,
  selected,
  flagged,
  timeTakenS,
  violationCount,
  autoSubmitReason,
  user,
  onRetake,
}: Props) {
  const [copied, setCopied] = useState(false);
  const autoSubmitted = autoSubmitReason !== null;

  const { correct, wrong, unanswered, flaggedCount, percentage, passed } = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((q, i) => {
      if (selected[i] === null || selected[i] === undefined) unanswered += 1;
      else if (selected[i] === q.answer) correct += 1;
      else wrong += 1;
    });

    const flaggedCount = flagged.filter(Boolean).length;
    const percentage = Math.round((correct / questions.length) * 100);
    return { correct, wrong, unanswered, flaggedCount, percentage, passed: percentage >= bank.pass_mark };
  }, [questions, selected, flagged, bank.pass_mark]);

  useEffect(() => {
    if (!user) return;

    const answers: Record<string, number> = {};
    questions.forEach((q, i) => {
      if (selected[i] !== null && selected[i] !== undefined) answers[q.id] = selected[i] as number;
    });
    const flaggedQuestions = flagged
      .map((f, i) => (f ? i : -1))
      .filter((i) => i >= 0);

    saveExamAttempt({
      user_id: user.id,
      bank_slug: bank.slug,
      score: correct,
      total: questions.length,
      percentage,
      passed,
      answers,
      time_taken_s: timeTakenS,
      completed_at: new Date().toISOString(),
      mode: 'exam',
      violation_count: violationCount,
      auto_submitted: autoSubmitted,
      flagged_questions: flaggedQuestions,
    }).catch(() => {});
    // Only persist once, right after the exam finishes and user identity resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleShare() {
    const emoji = passed ? '✅' : '📚';
    const verb = passed ? 'Passed' : 'Attempted';
    const text = [
      `${emoji} ${verb} the ${bank.name} quiz on QuizOps!`,
      `Score: ${correct}/${questions.length} (${percentage}%)`,
      ``,
      `Test your knowledge → https://quiz.autoshiftops.com/quiz/${bank.slug}`,
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled the native share sheet — nothing to do.
      }
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center border-4 mb-4 ${
            passed ? 'border-green text-green' : 'border-red-500 text-red-400'
          }`}
        >
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
        <h2 className="font-heading text-2xl font-semibold mb-1">
          {passed ? 'You passed!' : 'Not quite there'}
        </h2>
        <p className="text-gray-400">
          {correct} / {questions.length} correct · pass mark {bank.pass_mark}%
        </p>
      </div>

      {autoSubmitReason === 'violations' && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center">
          Exam ended: focus limit reached (3 violations) — auto-submitted due to
          repeated focus violations
        </div>
      )}
      {autoSubmitReason === 'time' && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center">
          Exam ended: time expired — auto-submitted
        </div>
      )}
      {autoSubmitReason !== 'violations' && violationCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 text-center">
          Exam ended with {violationCount} focus violation{violationCount === 1 ? '' : 's'}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10 text-center">
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{correct}</p>
          <p className="text-xs text-gray-400">Correct</p>
        </div>
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{wrong}</p>
          <p className="text-xs text-gray-400">Wrong</p>
        </div>
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{unanswered}</p>
          <p className="text-xs text-gray-400">Unanswered</p>
        </div>
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{flaggedCount}</p>
          <p className="text-xs text-gray-400">Flagged</p>
        </div>
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{Math.round(timeTakenS / 60)}m</p>
          <p className="text-xs text-gray-400">Time taken</p>
        </div>
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{violationCount}</p>
          <p className="text-xs text-gray-400">Violations</p>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="font-heading text-lg font-semibold mb-4">Question review</h3>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAnswer = selected[i];
            const isCorrect = userAnswer === q.answer;
            return (
              <div key={q.id} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium">
                    {i + 1}. {q.text}
                  </p>
                  {flagged[i] && <span title="Flagged for review">🚩</span>}
                </div>
                <div className="space-y-1 mb-2">
                  {q.options.map((option, optIndex) => {
                    const isAnswerOption = optIndex === q.answer;
                    const isUserOption = optIndex === userAnswer;
                    let classes = 'text-gray-400';
                    if (isAnswerOption) classes = 'text-green font-medium';
                    else if (isUserOption && !isCorrect) classes = 'text-red-400';
                    return (
                      <p key={optIndex} className={`text-sm ${classes}`}>
                        {isAnswerOption ? '✓ ' : isUserOption ? '✗ ' : '  '}
                        {option}
                      </p>
                    );
                  })}
                </div>
                {userAnswer === null || userAnswer === undefined ? (
                  <p className="text-sm text-gray-500 mb-2">Not answered</p>
                ) : null}
                <p className="text-sm text-gray-400">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleShare}
          className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
        >
          {copied ? 'Copied!' : 'Share result'}
        </button>
        <button
          onClick={onRetake}
          className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
        >
          Retake Exam
        </button>
        <Link
          href={`/quiz/${bank.slug}`}
          className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity text-sm"
        >
          Switch to Practice
        </Link>
        <Link
          href="/"
          className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
