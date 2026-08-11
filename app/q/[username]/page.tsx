import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getPublisherByUsername, getPublishedQuizzesByPublisher } from '@/lib/publishedQuiz';

// Same reasoning as [slug]/page.tsx — without this, publishing/unpublishing
// a quiz wouldn't show up here until the RSC cache happened to clear.
export const dynamic = 'force-dynamic';

type Props = { params: { username: string } };

// "Sudhakar Sajja" -> "SS", single-word names fall back to the first two
// letters ("quizops" -> "QU") so the avatar is never left blank.
function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerSupabase();
  const publisher = await getPublisherByUsername(supabase, params.username);
  if (!publisher) return {};

  const title = `${publisher.display_name} — QuizOps`;
  const description = `Quizzes by ${publisher.display_name} on QuizOps`;
  const url = `${process.env.APP_URL ?? ''}/q/${params.username}`;

  return {
    title,
    description,
    openGraph: { title, description, url },
  };
}

export default async function PublisherProfilePage({ params }: Props) {
  const supabase = createServerSupabase();
  const publisher = await getPublisherByUsername(supabase, params.username);
  if (!publisher) notFound();

  const quizzes = await getPublishedQuizzesByPublisher(supabase, publisher.id);
  const totalAttempts = quizzes.reduce((sum, q) => sum + q.attempt_count, 0);
  const initials = getInitials(publisher.display_name);

  return (
    <div style={{ background: '#080C14', minHeight: '100vh' }}>
      <div
        className="flex flex-col items-center mx-auto px-6 md:px-10"
        style={{ maxWidth: 960, paddingTop: 48, paddingBottom: 32, textAlign: 'center' }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#3E7BFA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F1F5F9', marginTop: 16 }}>
          {publisher.display_name}
        </h1>
        <p style={{ fontSize: 14, color: '#475569' }}>@{publisher.username}</p>

        {publisher.bio && (
          <p style={{ fontSize: 15, color: '#94A3B8', maxWidth: 480, marginTop: 8 }}>
            {publisher.bio}
          </p>
        )}

        {publisher.website_url && (
          <a
            href={publisher.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: '#3E7BFA', fontSize: 14, marginTop: 8 }}
          >
            {publisher.website_url}
          </a>
        )}

        <p
          className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1"
          style={{ fontSize: 13, color: '#475569', marginTop: 16 }}
        >
          <span>
            {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} published
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {totalAttempts} total {totalAttempts === 1 ? 'attempt' : 'attempts'} across all quizzes
          </span>
        </p>
      </div>

      <div className="mx-auto px-6 md:px-10" style={{ maxWidth: 960, paddingBottom: 64 }}>
        <p
          className="font-semibold uppercase"
          style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', marginBottom: 16 }}
        >
          Published quizzes
        </p>

        {quizzes.length === 0 ? (
          <div className="flex flex-col items-center text-center" style={{ padding: '64px 0' }}>
            <div aria-hidden="true" style={{ fontSize: 40, marginBottom: 12 }}>
              📝
            </div>
            <p style={{ color: '#475569', fontSize: 15 }}>No quizzes published yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                style={{ background: '#0F1520', border: '1px solid #1E2D45', borderRadius: 12, padding: 20 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span aria-hidden="true" style={{ fontSize: 22 }}>
                    {quiz.emoji}
                  </span>
                  <span style={{ fontSize: 12, color: '#475569' }}>
                    {quiz.attempt_count} {quiz.attempt_count === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>{quiz.description}</p>
                )}

                <div
                  className="flex items-center flex-wrap gap-x-2 gap-y-1"
                  style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}
                >
                  <span>{quiz.questions.length} questions</span>
                  <span aria-hidden="true">·</span>
                  <span>{Math.round(quiz.duration_s / 60)} min</span>
                  <span aria-hidden="true">·</span>
                  <span>Pass mark: {quiz.pass_mark}%</span>
                </div>

                {quiz.source_url && (
                  <a
                    href={quiz.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ display: 'block', color: '#3E7BFA', fontSize: 12, marginBottom: 12 }}
                  >
                    Read the article →
                  </a>
                )}

                <Link
                  href={`/q/${publisher.username}/${quiz.slug}`}
                  className="hover:opacity-90 transition-opacity"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    width: '100%',
                    background: '#3E7BFA',
                    color: 'white',
                    padding: '10px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  Take quiz →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
