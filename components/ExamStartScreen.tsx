'use client';

import { QuizBank } from '@/lib/types';

type Props = {
  bank: QuizBank;
  resuming: boolean;
  onStart: () => void;
};

const RULES: { ok: boolean; text: string }[] = [
  { ok: true, text: 'You can navigate between questions freely' },
  { ok: true, text: 'You can flag questions for review' },
  { ok: true, text: 'You can change answers before submitting' },
  { ok: false, text: 'No instant feedback until submission' },
  { ok: false, text: 'Leaving fullscreen counts as a violation' },
  { ok: false, text: '3 violations = auto-submit' },
];

export default function ExamStartScreen({ bank, resuming, onStart }: Props) {
  const minutes = Math.round(bank.duration_seconds / 60);

  return (
    <div className="mt-8 max-w-xl mx-auto text-center">
      <span className="text-5xl">{bank.emoji}</span>
      <h1 className="font-heading text-2xl font-semibold mt-4 mb-1">{bank.name}</h1>
      <p className="text-gray-400 mb-6">{bank.description}</p>

      <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-8">
        <span>{bank.question_count} questions</span>
        <span>{minutes} min</span>
        <span>Pass mark {bank.pass_mark}%</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 text-left mb-8">
        <h2 className="font-heading text-sm font-semibold text-gray-300 mb-3">
          Exam rules
        </h2>
        <ul className="space-y-2">
          {RULES.map((rule) => (
            <li key={rule.text} className="flex items-start gap-2 text-sm">
              <span className={rule.ok ? 'text-green' : 'text-red-400'}>
                {rule.ok ? '✓' : '✗'}
              </span>
              <span className="text-gray-300">{rule.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {resuming && (
        <p className="text-xs text-gray-500 mb-4">
          You have an exam in progress — resuming will restore your answers,
          flags, and remaining time.
        </p>
      )}

      <button
        onClick={onStart}
        className="px-6 py-3 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
      >
        {resuming ? 'Resume Exam' : 'Start Exam'}
      </button>
    </div>
  );
}
