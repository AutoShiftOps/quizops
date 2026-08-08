'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { QuizBank, Question } from '@/lib/types';
import { track } from '@/lib/analytics';

type Props = {
  bank: QuizBank;
  questions: Question[];
  answers: Record<string, number>;
  timeTakenS: number;
  user: User | null;
  onRetry: () => void;
};

export default function ResultsScreen({
  bank,
  questions,
  answers,
  timeTakenS,
  user,
  onRetry,
}: Props) {
  const [copied, setCopied] = useState(false);

  const { score, wrongAnswers, percentage, passed } = useMemo(() => {
    let score = 0;
    const wrong: Question[] = [];
    for (const q of questions) {
      if (answers[q.id] === q.answer) score += 1;
      else wrong.push(q);
    }
    const percentage = Math.round((score / questions.length) * 100);
    return { score, wrongAnswers: wrong, percentage, passed: percentage >= bank.pass_mark };
  }, [questions, answers, bank.pass_mark]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      const supabase = await getSupabaseClient();
      console.log('[ResultsScreen] saving attempt for user:', user.id, 'bank:', bank.slug);

      const { error: attemptError } = await supabase.from('quiz_attempts').upsert(
        {
          user_id: user.id,
          email: user.email,
          bank_slug: bank.slug,
          mode: 'practice',
          score,
          total: questions.length,
          percentage,
          passed,
          answers,
          time_taken_s: timeTakenS,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,bank_slug,mode' }
      );
      // Supabase-js resolves normally even when the query itself fails (RLS
      // denial, bad column, etc.) — only network-level failures reject the
      // promise below. Discarding `error` here (as this used to) meant a
      // practice score could silently fail to save with zero trace anywhere.
      if (attemptError) {
        console.error('[ResultsScreen] quiz_attempts upsert failed:', attemptError);
      } else {
        console.log('[ResultsScreen] quiz_attempts upsert succeeded');
      }

      const { data: progress, error: progressReadError } = await supabase
        .from('quiz_progress')
        .select('banks_done, weak_tags, total_taken')
        .eq('user_id', user.id)
        .maybeSingle();
      if (progressReadError) {
        console.error('[ResultsScreen] quiz_progress read failed:', progressReadError);
      }

      const banksDone = { ...(progress?.banks_done ?? {}), [bank.slug]: percentage };
      const weakTags = new Set<string>(progress?.weak_tags ?? []);
      wrongAnswers.forEach((q) => q.tags?.forEach((tag) => weakTags.add(tag)));

      const { error: progressWriteError } = await supabase.from('quiz_progress').upsert(
        {
          user_id: user.id,
          email: user.email,
          banks_done: banksDone,
          weak_tags: Array.from(weakTags),
          total_taken: (progress?.total_taken ?? 0) + 1,
          last_active: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (progressWriteError) {
        console.error('[ResultsScreen] quiz_progress upsert failed:', progressWriteError);
      }
    })().catch((err) => {
      console.error('[ResultsScreen] save effect threw:', err);
    });
    // Only persist once, right after the quiz finishes and user identity resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleShare() {
    track('quiz_shared', { bank_slug: bank.slug });
    const emoji = passed ? '✅' : '📚';
    const verb = passed ? 'Passed' : 'Attempted';
    const text = [
      `${emoji} ${verb} the ${bank.name} quiz on QuizOps!`,
      `Score: ${score}/${questions.length} (${percentage}%)`,
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
          {score} / {questions.length} correct · pass mark {bank.pass_mark}%
        </p>
        {!user && (
          <p className="text-xs text-gray-500 mt-2">
            Sign in next time to save your progress.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10 text-center">
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{score}</p>
          <p className="text-xs text-gray-400">Correct</p>
        </div>
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{questions.length - score}</p>
          <p className="text-xs text-gray-400">Wrong</p>
        </div>
        <div className="bg-surface border border-border rounded-lg py-4">
          <p className="text-2xl font-semibold">{Math.round(timeTakenS / 60)}m</p>
          <p className="text-xs text-gray-400">Time taken</p>
        </div>
      </div>

      {wrongAnswers.length > 0 && (
        <div className="mb-10">
          <h3 className="font-heading text-lg font-semibold mb-4">
            Review wrong answers
          </h3>
          <div className="space-y-4">
            {wrongAnswers.map((q) => (
              <div key={q.id} className="bg-surface border border-border rounded-lg p-4">
                <p className="font-medium mb-2">{q.text}</p>
                <p className="text-sm text-red-400 mb-1">
                  Your answer:{' '}
                  {answers[q.id] !== undefined ? q.options[answers[q.id]] : 'Not answered'}
                </p>
                <p className="text-sm text-green mb-2">
                  Correct answer: {q.options[q.answer]}
                </p>
                <p className="text-sm text-gray-400">{q.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleShare}
          className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
        >
          {copied ? 'Copied!' : 'Share result'}
        </button>
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
        >
          Try again
        </button>
        {bank.source_url && (
          <a
            href={bank.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Read the original post
          </a>
        )}
        <a
          href="/"
          className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
