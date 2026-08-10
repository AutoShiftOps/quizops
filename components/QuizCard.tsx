import Link from 'next/link';
import { QuizBank } from '@/lib/types';

type Score = { percentage: number; passed: boolean };

type Props = {
  bank: QuizBank;
  practiceScore?: Score | null;
  examScore?: Score | null;
  hasAttempted?: boolean;
};

// Topic-colour initials badge — replaces emoji rendering entirely (broken
// on Windows Chrome) and the "/>" code-glyph fallback (looked like a
// placeholder). Plain system-ui text in a coloured square: nothing for any
// OS/browser font-matching to get wrong, and it generalises to every bank's
// topic instead of special-casing DevOps.
const TOPIC_COLORS: Record<string, { bg: string; color: string }> = {
  DevOps: { bg: '#EFF6FF', color: '#1D4ED8' },
  Cloud: { bg: '#F0FDF4', color: '#15803D' },
  Security: { bg: '#FFF7ED', color: '#C2410C' },
  Frontend: { bg: '#FDF4FF', color: '#7E22CE' },
  default: { bg: '#F4F4F5', color: '#71717A' },
};

function BankIcon({ topic }: { topic: string }) {
  const scheme = TOPIC_COLORS[topic] || TOPIC_COLORS.default;
  const initials = topic.slice(0, 2).toUpperCase();

  return (
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: scheme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: scheme.color,
        letterSpacing: '-0.5px',
        fontFamily: 'system-ui, sans-serif',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function QuizCard({ bank, practiceScore, examScore, hasAttempted }: Props) {
  const minutes = Math.round(bank.duration_seconds / 60);
  const hasAnyScore = Boolean(practiceScore) || Boolean(examScore);

  return (
    <div
      className="bg-white border border-[#E4E4E7] hover:border-[#D4D4D8] transition-colors rounded-xl p-6"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 12 }}
    >
      <div className="flex items-start justify-between mb-3">
        <BankIcon topic={bank.topic} />
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
