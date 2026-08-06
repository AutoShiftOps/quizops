import type { SupabaseClient } from '@supabase/supabase-js';
import { Publisher, PublishedQuiz } from './types';

export async function getPublisherByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<Publisher | null> {
  const { data } = await supabase
    .from('publishers')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  return data as Publisher | null;
}

export async function getPublishedQuiz(
  supabase: SupabaseClient,
  publisherId: string,
  slug: string
): Promise<PublishedQuiz | null> {
  const { data } = await supabase
    .from('published_quizzes')
    .select('*')
    .eq('publisher_id', publisherId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data as PublishedQuiz | null;
}

export async function savePublishedAttempt(
  supabase: SupabaseClient,
  quizId: string,
  publisherId: string,
  userId: string | null,
  score: number,
  total: number,
  answers: Record<string, number>,
  timeTakenS: number,
  passMark: number
): Promise<boolean> {
  const percentage = Math.round((score / total) * 100);
  const { error } = await supabase.from('published_quiz_attempts').insert({
    quiz_id: quizId,
    publisher_id: publisherId,
    user_id: userId,
    score,
    total,
    percentage,
    passed: percentage >= passMark,
    answers,
    time_taken_s: timeTakenS,
  });
  // Supabase-js resolves normally even when the query itself fails (RLS
  // denial, bad column, etc.) — only network-level failures reject the
  // promise. Discarding `error` here (as this used to, same bug as 410c318)
  // meant a reader's attempt could silently fail to save with zero trace.
  if (error) {
    console.error('savePublishedAttempt failed:', error.message, error.code);
    return false;
  }
  return true;
}

export async function incrementAttemptCount(
  supabase: SupabaseClient,
  quizId: string
): Promise<boolean> {
  const { data, error: readError } = await supabase
    .from('published_quizzes')
    .select('attempt_count')
    .eq('id', quizId)
    .maybeSingle();
  if (readError) {
    console.error('incrementAttemptCount read failed:', readError.message, readError.code);
    return false;
  }
  const current = data?.attempt_count ?? 0;
  const { data: updated, error: updateError } = await supabase
    .from('published_quizzes')
    .update({ attempt_count: current + 1 })
    .eq('id', quizId)
    .select('id');
  if (updateError) {
    console.error('incrementAttemptCount update failed:', updateError.message, updateError.code);
    return false;
  }
  // An RLS policy that silently filters out disallowed rows (rather than
  // erroring) makes this update a no-op with `error: null` — checking
  // `error` alone isn't enough to catch that. This table's UPDATE policy is
  // owner-only (`auth.uid() = publisher_id`), but this function runs as
  // whoever is *taking* the quiz — almost never the publisher — so this
  // path is confirmed to silently fail for real readers today. Flagging it
  // as a failure here at least surfaces it instead of hiding it; the actual
  // fix needs a policy change (or a server-side increment), which is a
  // separate, larger change than this error-checking pass.
  if (!updated || updated.length === 0) {
    console.error(
      'incrementAttemptCount: update matched 0 rows for quiz',
      quizId,
      '— likely blocked by the owner-only RLS policy on published_quizzes (see comment above)'
    );
    return false;
  }
  return true;
}
