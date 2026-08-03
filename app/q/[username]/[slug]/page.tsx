import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getPublisherByUsername, getPublishedQuiz } from '@/lib/publishedQuiz';
import PublishedQuizEngine from '@/components/PublishedQuizEngine';

type Props = { params: { username: string; slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerSupabase();
  const publisher = await getPublisherByUsername(supabase, params.username);
  if (!publisher) return {};
  const quiz = await getPublishedQuiz(supabase, publisher.id, params.slug);
  if (!quiz) return {};

  const url = `${process.env.APP_URL ?? ''}/q/${params.username}/${params.slug}`;

  return {
    title: `${quiz.title} | QuizOps`,
    description: quiz.description ?? undefined,
    openGraph: {
      title: quiz.title,
      description: quiz.description ?? undefined,
      url,
    },
  };
}

export default async function PublicQuizPage({ params }: Props) {
  const supabase = createServerSupabase();
  const publisher = await getPublisherByUsername(supabase, params.username);
  if (!publisher) notFound();

  const quiz = await getPublishedQuiz(supabase, publisher.id, params.slug);
  if (!quiz) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-6 pb-4 border-b border-border">
        <p className="text-sm text-gray-400">
          By <span className="text-white">{publisher.display_name}</span>
          {quiz.source_url && (
            <>
              {' · '}
              <a
                href={quiz.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Read the original article
              </a>
            </>
          )}
        </p>
      </div>

      <PublishedQuizEngine quiz={quiz} />

      {publisher.tier === 'free' && (
        <p className="text-center text-xs text-gray-500 mt-10">
          Powered by{' '}
          <a href="/" className="text-accent hover:underline">
            QuizOps
          </a>
        </p>
      )}
    </div>
  );
}
