'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { savePublishedAttempt, incrementAttemptCount } from '@/lib/publishedQuiz';
import { PublishedQuiz } from '@/lib/types';

type Props = {
  quiz: PublishedQuiz;
};

export default function PublishedQuizEngine({ quiz }: Props) {
  const questions = quiz.questions;
  const [user, setUser] = useState<User | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.duration_s);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCurrent = answers[currentQuestion.id] !== undefined;

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

  const finishQuiz = useCallback(() => setFinished(true), []);

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

  const timeTakenS = quiz.duration_s - Math.max(timeLeft, 0);
  const score = questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0),
    0
  );
  const percentage = Math.round((score / questions.length) * 100);
  const passed = percentage >= quiz.pass_mark;
  const wrongAnswers = questions.filter((q) => answers[q.id] !== q.answer);

  useEffect(() => {
    if (!finished || saved) return;
    (async () => {
      const supabase = await getSupabaseClient();
      await savePublishedAttempt(
        supabase,
        quiz.id,
        quiz.publisher_id,
        user?.id ?? null,
        score,
        questions.length,
        answers,
        timeTakenS,
        quiz.pass_mark
      );
      await incrementAttemptCount(supabase, quiz.id);
      setSaved(true);
    })().catch(() => {});
    // Only persist once, right after the quiz finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) {
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
            {score} / {questions.length} correct · pass mark {quiz.pass_mark}%
          </p>
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

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {quiz.source_url && (
            <a
              href={quiz.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity text-sm"
            >
              Read the original article →
            </a>
          )}
          <a
            href="/"
            className="px-5 py-2 rounded-md border border-border hover:border-accent transition-colors text-sm"
          >
            More quizzes on QuizOps
          </a>
        </div>
      </div>
    );
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / questions.length) * 100;

  return (
    <div className="mt-8">
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
