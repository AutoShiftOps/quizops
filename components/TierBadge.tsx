import { Publisher } from '@/lib/types';

export default function TierBadge({ publisher }: { publisher: Publisher }) {
  const isFree = publisher.tier === 'free';
  const pct = isFree ? Math.min((publisher.quiz_count / 3) * 100, 100) : 100;

  return (
    <span
      className={`inline-flex items-center gap-2.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
        isFree ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'bg-success/10 text-success'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isFree ? 'bg-[#1D4ED8]' : 'bg-success'}`} />
      {isFree ? `Free · ${publisher.quiz_count} of 3 quizzes used` : 'Pro · Unlimited'}
      {isFree && (
        <span className="w-14 h-1.5 rounded-full bg-[#BFDBFE] overflow-hidden">
          <span
            className="block h-full rounded-full bg-[#1D4ED8]"
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
    </span>
  );
}
