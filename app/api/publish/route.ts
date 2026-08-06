import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSupabase';
import { getPublisher, checkTierLimit, incrementQuizCount } from '@/lib/publisher';
import { validateTitle, validateQuestions } from '@/lib/quizValidation';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const authed = await getAuthenticatedUser(req);
  if (!authed) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const publisher = await getPublisher(authed.supabase, authed.user.id);
  if (!publisher) {
    return NextResponse.json({ error: 'no_publisher_profile' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    title,
    description,
    emoji,
    source_url: sourceUrl,
    topic,
    duration_s: durationS,
    pass_mark: passMark,
    questions,
    status: requestedStatus,
  } = body as {
    title?: string;
    description?: string;
    emoji?: string;
    source_url?: string;
    topic?: string;
    duration_s?: number;
    pass_mark?: number;
    questions?: unknown;
    status?: 'draft' | 'published';
  };

  const status: 'draft' | 'published' = requestedStatus === 'draft' ? 'draft' : 'published';

  // Drafts don't count against the free-tier limit — only enforce it for
  // quizzes that will actually be published.
  if (status === 'published' && checkTierLimit(publisher)) {
    return NextResponse.json(
      {
        error: 'tier_limit_reached',
        message: 'Free tier limit reached (3/3 quizzes). Upgrade to Pro for more.',
      },
      { status: 403 }
    );
  }

  if (!validateTitle(title)) {
    return NextResponse.json(
      { error: 'invalid_title', message: 'Please enter a title (max 100 characters).' },
      { status: 400 }
    );
  }
  // Drafts can be saved with as little as one question — the 3-question
  // minimum only applies once you're actually publishing.
  const minQuestions = status === 'draft' ? 1 : 3;
  if (!validateQuestions(questions, minQuestions)) {
    return NextResponse.json(
      {
        error: 'invalid_questions',
        message:
          status === 'draft'
            ? 'Add at least 1 question with 4 options, a correct answer, and an explanation.'
            : 'Every question needs 4 options, a correct answer, and an explanation — check for any blank fields.',
      },
      { status: 400 }
    );
  }

  const baseSlug = slugify(title) || 'quiz';
  let slug = baseSlug;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await authed.supabase
      .from('published_quizzes')
      .select('id')
      .eq('publisher_id', publisher.id)
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const { error: insertError } = await authed.supabase.from('published_quizzes').insert({
    publisher_id: publisher.id,
    slug,
    title: title.trim(),
    description: description ?? null,
    source_url: sourceUrl ?? null,
    topic: topic ?? null,
    emoji: emoji || '📝',
    duration_s: durationS ?? 600,
    pass_mark: passMark ?? 70,
    questions,
    status,
  });

  if (insertError) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  // Only published quizzes count against the free-tier limit.
  if (status === 'published') {
    await incrementQuizCount(authed.supabase, publisher.id);
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const url = `${appUrl}/q/${publisher.username}/${slug}`;
  const embedHtml = `<a href="${url}" target="_blank">Test your understanding of this article →</a>`;
  const badgeMarkdown = `[![Quiz](${appUrl}/api/badge/${publisher.username}/${slug})](${url})`;

  return NextResponse.json({ url, embedHtml, badgeMarkdown });
}
