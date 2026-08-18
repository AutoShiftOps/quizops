import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getPublisherByUsername, getPublishedQuiz } from '@/lib/publishedQuiz';
import PublishedQuizEngine from '@/components/PublishedQuizEngine';

// Same reasoning as the public /q page — without this, an unpublished or
// just-edited quiz would keep serving a stale cached version inside every
// embedder's iframe.
export const dynamic = 'force-dynamic';

type Props = { params: { username: string; slug: string } };

// Minimal — no NavBar, no footer, no publisher attribution bar. Those are
// deliberately absent here rather than hidden via a prop, since this route
// never had them to begin with.
export default async function EmbedQuizPage({ params }: Props) {
  const supabase = createServerSupabase();
  const publisher = await getPublisherByUsername(supabase, params.username);
  if (!publisher) notFound();

  const quiz = await getPublishedQuiz(supabase, publisher.id, params.slug);
  if (!quiz) notFound();

  return <PublishedQuizEngine quiz={quiz} embedMode publisherTier={publisher.tier} />;
}
