'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
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

  const finishQuiz = useCallback(() => {
    setFinished(true);
  }, []);

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

  if (finished) {
    return (
      <ResultsScreen
        bank={bank}
        questions={questions}
        answers={answers}
        timeTakenS={bank.duration_seconds - Math.max(timeLeft, 0)}
        user={user}
      />
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
