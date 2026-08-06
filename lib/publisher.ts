import type { SupabaseClient } from '@supabase/supabase-js';
import { Publisher } from './types';

export async function getPublisher(
  supabase: SupabaseClient,
  userId: string
): Promise<Publisher | null> {
  const { data } = await supabase
    .from('publishers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data as Publisher | null;
}

export async function createPublisher(
  supabase: SupabaseClient,
  userId: string,
  username: string,
  displayName: string,
  bio?: string
): Promise<Publisher> {
  const { data, error } = await supabase
    .from('publishers')
    .insert({ id: userId, username, display_name: displayName, bio: bio || null })
    .select('*')
    .single();
  if (error) throw error;
  return data as Publisher;
}

export async function isUsernameTaken(
  supabase: SupabaseClient,
  username: string
): Promise<boolean> {
  const { data } = await supabase
    .from('publishers')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  return data !== null;
}

export async function incrementQuizCount(
  supabase: SupabaseClient,
  publisherId: string
): Promise<boolean> {
  const { data, error: readError } = await supabase
    .from('publishers')
    .select('quiz_count')
    .eq('id', publisherId)
    .maybeSingle();
  if (readError) {
    console.error('incrementQuizCount read failed:', readError.message, readError.code);
    return false;
  }
  const current = data?.quiz_count ?? 0;
  const { error: updateError } = await supabase
    .from('publishers')
    .update({ quiz_count: current + 1 })
    .eq('id', publisherId);
  if (updateError) {
    console.error('incrementQuizCount update failed:', updateError.message, updateError.code);
    return false;
  }
  return true;
}

export async function decrementQuizCount(
  supabase: SupabaseClient,
  publisherId: string
): Promise<boolean> {
  const { data, error: readError } = await supabase
    .from('publishers')
    .select('quiz_count')
    .eq('id', publisherId)
    .maybeSingle();
  if (readError) {
    console.error('decrementQuizCount read failed:', readError.message, readError.code);
    return false;
  }
  const current = data?.quiz_count ?? 0;
  const { error: updateError } = await supabase
    .from('publishers')
    .update({ quiz_count: Math.max(current - 1, 0) })
    .eq('id', publisherId);
  if (updateError) {
    console.error('decrementQuizCount update failed:', updateError.message, updateError.code);
    return false;
  }
  return true;
}

export function checkTierLimit(publisher: Publisher): boolean {
  return publisher.tier === 'free' && publisher.quiz_count >= 3;
}
