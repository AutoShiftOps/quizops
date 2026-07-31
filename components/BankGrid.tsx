'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { QuizBank } from '@/lib/types';
import QuizCard from './QuizCard';

type Score = { percentage: number; passed: boolean };
type ScoreMap = Record<string, { practice?: Score; exam?: Score }>;

export default function BankGrid({ banks }: { banks: QuizBank[] }) {
  const [scoreMap, setScoreMap] = useState<ScoreMap>({});

  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('bank_slug, mode, percentage, passed')
        .eq('user_id', session.user.id);

      const grouped = (attempts ?? []).reduce<ScoreMap>((acc, row) => {
        if (!acc[row.bank_slug]) acc[row.bank_slug] = {};
        const score = { percentage: row.percentage, passed: row.passed };
        if (row.mode === 'practice') acc[row.bank_slug].practice = score;
        else if (row.mode === 'exam') acc[row.bank_slug].exam = score;
        return acc;
      }, {});

      if (active) setScoreMap(grouped);
    })().catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {banks.map((bank) => (
        <QuizCard
          key={bank.slug}
          bank={bank}
          practiceScore={scoreMap[bank.slug]?.practice ?? null}
          examScore={scoreMap[bank.slug]?.exam ?? null}
        />
      ))}
    </section>
  );
}
