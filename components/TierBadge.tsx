import { Publisher } from '@/lib/types';

export default function TierBadge({ publisher }: { publisher: Publisher }) {
  const isFree = publisher.tier === 'free';

  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        isFree ? 'bg-amber-500/20 text-amber-400' : 'bg-green/20 text-green'
      }`}
    >
      {isFree ? `Free · ${publisher.quiz_count} of 3 quizzes used` : 'Pro · Unlimited'}
    </span>
  );
}
