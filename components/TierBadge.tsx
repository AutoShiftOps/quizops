import { Publisher } from '@/lib/types';

export default function TierBadge({ publisher }: { publisher: Publisher }) {
  const isFree = publisher.tier === 'free';
  const pct = isFree ? Math.min((publisher.quiz_count / 3) * 100, 100) : 100;

  return (
    <span
      className={`inline-flex items-center gap-2.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
        isFree ? 'bg-amber-500/10 text-amber-400' : 'bg-green/10 text-green'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isFree ? 'bg-amber-400' : 'bg-green'}`}
      />
      {isFree ? `Free · ${publisher.quiz_count} of 3 quizzes used` : 'Pro · Unlimited'}
      {isFree && (
        <span className="w-14 h-1.5 rounded-full bg-black/30 overflow-hidden">
          <span
            className="block h-full rounded-full bg-amber-400"
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
    </span>
  );
}
