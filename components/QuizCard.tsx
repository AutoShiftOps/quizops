'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { QuizBank } from '@/lib/types';

export default function QuizCard({ bank }: { bank: QuizBank }) {
  const [percentage, setPercentage] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('quiz_attempts')
        .select('percentage')
        .eq('user_id', session.user.id)
        .eq('bank_slug', bank.slug)
        .maybeSingle();

      if (active && data) setPercentage(data.percentage);
    })().catch(() => {});

    return () => {
      active = false;
    };
  }, [bank.slug]);

  const minutes = Math.round(bank.duration_seconds / 60);

  return (
    <Link
      href={`/quiz/${bank.slug}`}
      className="block bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{bank.emoji}</span>
        {percentage !== null && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              percentage >= bank.pass_mark
                ? 'bg-green/20 text-green'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {percentage}%
          </span>
        )}
      </div>
      <h3 className="font-heading text-lg font-semibold mb-1">{bank.name}</h3>
      <p className="text-gray-400 text-sm mb-4">{bank.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="px-2 py-1 rounded-full bg-accent/10 text-accent">
          {bank.topic}
        </span>
        <span>{bank.question_count} questions</span>
        <span>{minutes} min</span>
      </div>
    </Link>
  );
}
