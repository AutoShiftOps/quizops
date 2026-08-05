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
  if (checkTierLimit(publisher)) {
    return NextResponse.json(
      {
        error: 'tier_limit_reached',
        message: 'Free tier limit reached (3/3 quizzes). Upgrade to Pro for more.',
      },
      { status: 403 }
    );
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
  } = body as {
    title?: string;
    description?: string;
    emoji?: string;
    source_url?: string;
    topic?: string;
    duration_s?: number;
    pass_mark?: number;
    questions?: unknown;
  };

  if (!validateTitle(title)) {
    return NextResponse.json(
      { error: 'invalid_title', message: 'Please enter a title (max 100 characters).' },
      { status: 400 }
    );
  }
  if (!validateQuestions(questions)) {
    return NextResponse.json(
      {
        error: 'invalid_questions',
        message:
          'Every question needs 4 options, a correct answer, and an explanation — check for any blank fields.',
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
    status: 'published',
  });

  if (insertError) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  await incrementQuizCount(authed.supabase, publisher.id);

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const url = `${appUrl}/q/${publisher.username}/${slug}`;
  const embedHtml = `<a href="${url}" target="_blank">Test your understanding of this article →</a>`;
  const badgeMarkdown = `[![Quiz](${appUrl}/api/badge/${publisher.username}/${slug})](${url})`;

  return NextResponse.json({ url, embedHtml, badgeMarkdown });
}
