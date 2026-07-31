import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExamAttempt } from './types';

let client: SupabaseClient | null = null;
let clientPromise: Promise<SupabaseClient> | null = null;

async function fetchConfig(): Promise<{ supabaseUrl: string; supabaseAnon: string }> {
  const res = await fetch('/api/config');
  if (!res.ok) {
    throw new Error('Failed to load Supabase config from /api/config');
  }
  return res.json();
}

// Lazily creates a singleton Supabase client using keys fetched from
// /api/config, since env vars are server-only (not NEXT_PUBLIC_*).
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (client) return client;
  if (!clientPromise) {
    clientPromise = fetchConfig().then(({ supabaseUrl, supabaseAnon }) => {
      client = createClient(supabaseUrl, supabaseAnon);
      return client;
    });
  }
  return clientPromise;
}

export async function saveExamAttempt(attempt: ExamAttempt): Promise<void> {
  const supabase = await getSupabaseClient();
  await supabase.from('quiz_attempts').upsert(
    {
      user_id: attempt.user_id,
      bank_slug: attempt.bank_slug,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      passed: attempt.passed,
      answers: attempt.answers,
      time_taken_s: attempt.time_taken_s,
      completed_at: attempt.completed_at,
      mode: attempt.mode,
      violation_count: attempt.violation_count,
      auto_submitted: attempt.auto_submitted,
      flagged_questions: attempt.flagged_questions,
    },
    { onConflict: 'user_id,bank_slug,mode' }
  );
}
