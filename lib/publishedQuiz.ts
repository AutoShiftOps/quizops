import type { SupabaseClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
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
    Sentry.captureException(new Error(error.message), {
      tags: { operation: 'savePublishedAttempt', code: error.code },
    });
    return false;
  }
  return true;
}

export async function incrementAttemptCount(
  supabase: SupabaseClient,
  quizId: string
): Promise<boolean> {
  // published_quizzes' UPDATE policy is owner-only (auth.uid() =
  // publisher_id), but this runs in the READER's context — almost always a
  // guest or a signed-in user who isn't the publisher. A direct update()
  // was silently filtered out by RLS (0 rows affected, no error at all —
  // see the audit in 38fc43b). Routing through a SECURITY DEFINER function
  // bypasses that: it runs as its owner (postgres) and can only ever do the
  // one narrow thing it's written to do.
  const { error } = await supabase.rpc('increment_attempt_count', { quiz_id: quizId });
  if (error) {
    console.error('incrementAttemptCount failed:', error.message, error.code);
    Sentry.captureException(new Error(error.message), {
      tags: { operation: 'incrementAttemptCount', code: error.code },
    });
    return false;
  }
  return true;
}
