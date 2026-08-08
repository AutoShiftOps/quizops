import Link from 'next/link';
import { QuizBank } from '@/lib/types';

type Score = { percentage: number; passed: boolean };

type Props = {
  bank: QuizBank;
  practiceScore?: Score | null;
  examScore?: Score | null;
  hasAttempted?: boolean;
};

export default function QuizCard({ bank, practiceScore, examScore, hasAttempted }: Props) {
  const minutes = Math.round(bank.duration_seconds / 60);
  const hasAnyScore = Boolean(practiceScore) || Boolean(examScore);

  return (
    <div
      className="bg-white border border-[#E4E4E7] hover:border-[#D4D4D8] transition-colors rounded-xl p-6"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 12 }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{bank.emoji}</span>
      </div>
      <h3 className="font-heading text-lg font-semibold mb-1 text-[#18181B]">{bank.name}</h3>
      <p className="text-[#71717A] text-sm mb-4">{bank.description}</p>
      <div className="flex items-center gap-3 text-xs text-[#71717A] mb-4">
        <span className="px-2 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">{bank.topic}</span>
        <span>{bank.question_count} questions</span>
        <span>{minutes} min</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
        {!hasAnyScore && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#F4F4F5] text-[#71717A] self-start">
            Not attempted
          </span>
        )}
        {practiceScore && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full border border-success text-success bg-transparent self-start">
            Practice {practiceScore.percentage}% ✓
          </span>
        )}
        {examScore && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent/10 text-accent self-start">
            Exam {examScore.percentage}% ✓
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/quiz/${bank.slug}`}
          className="flex-1 text-center text-sm px-4 py-2 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
        >
          {hasAttempted ? 'Practice again' : 'Practice'}
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
