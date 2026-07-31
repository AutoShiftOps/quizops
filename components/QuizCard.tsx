import Link from 'next/link';
import { QuizBank } from '@/lib/types';

type Score = { percentage: number; passed: boolean };

type Props = {
  bank: QuizBank;
  practiceScore?: Score | null;
  examScore?: Score | null;
};

export default function QuizCard({ bank, practiceScore, examScore }: Props) {
  const minutes = Math.round(bank.duration_seconds / 60);
  const hasAnyScore = Boolean(practiceScore) || Boolean(examScore);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{bank.emoji}</span>
      </div>
      <h3 className="font-heading text-lg font-semibold mb-1">{bank.name}</h3>
      <p className="text-gray-400 text-sm mb-4">{bank.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
        <span className="px-2 py-1 rounded-full bg-accent/10 text-accent">
          {bank.topic}
        </span>
        <span>{bank.question_count} questions</span>
        <span>{minutes} min</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
        {!hasAnyScore && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-border text-gray-400 self-start">
            Not attempted
          </span>
        )}
        {practiceScore && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full border bg-transparent self-start ${
              practiceScore.passed
                ? 'border-green text-green'
                : 'border-red-500 text-red-400'
            }`}
          >
            Practice {practiceScore.percentage}%
          </span>
        )}
        {examScore && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full self-start ${
              examScore.passed ? 'bg-green/20 text-green' : 'bg-red-500/20 text-red-400'
            }`}
          >
            Exam {examScore.percentage}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/quiz/${bank.slug}`}
          className="flex-1 text-center text-sm px-4 py-2 rounded-md border border-border hover:border-accent transition-colors"
        >
          Practice
        </Link>
        <Link
          href={`/exam/${bank.slug}`}
          className="flex-1 text-center text-sm px-4 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          Take Exam
        </Link>
      </div>
    </div>
  );
}
