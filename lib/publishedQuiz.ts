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
): Promise<void> {
  const percentage = Math.round((score / total) * 100);
  await supabase.from('published_quiz_attempts').insert({
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
}

export async function incrementAttemptCount(
  supabase: SupabaseClient,
  quizId: string
): Promise<void> {
  const { data } = await supabase
    .from('published_quizzes')
    .select('attempt_count')
    .eq('id', quizId)
    .maybeSingle();
  const current = data?.attempt_count ?? 0;
  await supabase
    .from('published_quizzes')
    .update({ attempt_count: current + 1 })
    .eq('id', quizId);
}
