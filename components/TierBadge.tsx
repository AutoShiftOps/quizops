import { Publisher } from '@/lib/types';

export default function TierBadge({ publisher }: { publisher: Publisher }) {
  const isFree = publisher.tier === 'free';
  const pct = isFree ? Math.min((publisher.quiz_count / 3) * 100, 100) : 100;

  return (
    <span
      className="inline-flex items-center gap-2.5 text-xs font-semibold px-3 py-1.5 rounded-full"
      style={
        isFree
          ? { background: 'rgba(62,123,250,0.12)', color: '#3E7BFA' }
          : { background: 'rgba(34,197,94,0.1)', color: '#22C55E' }
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: isFree ? '#3E7BFA' : '#22C55E' }}
      />
      {isFree ? `Free · ${publisher.quiz_count} of 3 quizzes used` : 'Pro · Unlimited'}
      {isFree && (
        <span
          className="w-14 h-1.5 rounded-full overflow-hidden"
          style={{ background: '#253447' }}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct}%`, background: '#3E7BFA' }}
          />
        </span>
      )}
    </span>
  );
}
