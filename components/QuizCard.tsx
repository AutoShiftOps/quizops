import Link from 'next/link';
import { QuizBank } from '@/lib/types';

type Score = { percentage: number; passed: boolean };

type Props = {
  bank: QuizBank;
  practiceScore?: Score | null;
  examScore?: Score | null;
  hasAttempted?: boolean;
};

// Topic-colour initials badge — plain system-ui text in a coloured square,
// no emoji glyph involved (avoids the Windows Chrome colour-emoji
// font-matching problem entirely) and generalises to every bank's topic.
const TOPIC_COLORS: Record<string, { bg: string; color: string }> = {
  DevOps: { bg: 'rgba(62,123,250,0.12)', color: '#3E7BFA' },
  Cloud: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E' },
  Security: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  Frontend: { bg: 'rgba(168,85,247,0.12)', color: '#A855F7' },
  default: { bg: '#161D2E', color: '#94A3B8' },
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
    <div className="dark-card hover:border-dark-border2 transition-colors p-6">
      <div className="flex items-start justify-between mb-3">
        <BankIcon topic={bank.topic} />
      </div>
      <h3 className="font-heading text-lg font-semibold mb-1 text-content-primary">{bank.name}</h3>
      <p className="text-content-secondary text-sm mb-4">{bank.description}</p>
      <div className="flex items-center gap-3 text-xs text-content-secondary mb-4">
        <span
          className="px-2 py-1 rounded-full"
          style={{ background: '#161D2E', color: '#3E7BFA' }}
        >
          {bank.topic}
        </span>
        <span>{bank.question_count} questions</span>
        <span>{minutes} min</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
        {!hasAnyScore && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full self-start"
            style={{ background: '#161D2E', color: '#94A3B8' }}
          >
            Not attempted
          </span>
        )}
        {practiceScore && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full self-start"
            style={{ border: '1px solid #22C55E', color: '#22C55E', background: 'transparent' }}
          >
            Practice {practiceScore.percentage}% ✓
          </span>
        )}
        {examScore && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full self-start"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
          >
            Exam {examScore.percentage}% ✓
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/quiz/${bank.slug}`}
          className="flex-1 text-center text-sm px-4 py-2 rounded-md border border-dark-border text-content-secondary hover:border-dark-border2 hover:text-content-primary transition-colors"
        >
          {hasAttempted ? 'Practice again' : 'Practice'}
        </Link>
        <Link
          href={`/exam/${bank.slug}`}
          className="flex-1 text-center text-sm px-4 py-2 rounded-md bg-brand-blue text-white font-medium hover:opacity-90 transition-opacity"
        >
          Take Exam
        </Link>
      </div>
    </div>
  );
}
