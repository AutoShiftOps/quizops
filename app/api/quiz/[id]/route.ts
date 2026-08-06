import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthedRequest } from '@/lib/serverSupabase';
import { getPublisher, checkTierLimit, incrementQuizCount, decrementQuizCount } from '@/lib/publisher';
import { validateTitle, validateQuestions } from '@/lib/quizValidation';
import { PublishedQuiz } from '@/lib/types';

async function getOwnedQuiz(
  authed: AuthedRequest,
  id: string
): Promise<PublishedQuiz | null> {
  const { data } = await authed.supabase
    .from('published_quizzes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  const quiz = data as PublishedQuiz | null;
  if (!quiz || quiz.publisher_id !== authed.user.id) return null;
  return quiz;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authed = await getAuthenticatedUser(req);
  if (!authed) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const quiz = await getOwnedQuiz(authed, params.id);
  if (!quiz) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const bodyKeys = Object.keys(body);

  // Status-only update (unpublish / republish / publish a draft). Only
  // 'published' quizzes count against the free-tier limit, so quiz_count
  // is adjusted on the actual transition, not just set-and-forget.
  if (bodyKeys.length === 1 && bodyKeys[0] === 'status') {
    if (body.status !== 'draft' && body.status !== 'published') {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
    }

    if (body.status === 'published' && quiz.status !== 'published') {
      const publisher = await getPublisher(authed.supabase, authed.user.id);
      if (publisher && checkTierLimit(publisher)) {
        return NextResponse.json(
          {
            error: 'tier_limit_reached',
            message: 'Free tier limit reached (3/3 quizzes). Upgrade to Pro for more.',
          },
          { status: 403 }
        );
      }
    }

    const { error } = await authed.supabase
      .from('published_quizzes')
      .update({ status: body.status })
      .eq('id', params.id);
    if (error) {
      return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }

    if (body.status === 'published' && quiz.status !== 'published') {
      const incremented = await incrementQuizCount(authed.supabase, quiz.publisher_id);
      if (!incremented) {
        console.error('[quiz PATCH] quiz_count failed to increment for publisher:', quiz.publisher_id);
      }
    } else if (body.status === 'draft' && quiz.status === 'published') {
      const decremented = await decrementQuizCount(authed.supabase, quiz.publisher_id);
      if (!decremented) {
        console.error('[quiz PATCH] quiz_count failed to decrement for publisher:', quiz.publisher_id);
      }
    }

    return NextResponse.json({ success: true });
  }

  // Full content update — same validation as /api/publish. A draft being
  // edited only needs 1 question; publishing (via the status branch above,
  // or the initial /api/publish call) is what enforces the 3-question min.
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
  const minQuestions = quiz.status === 'draft' ? 1 : 3;
  if (!validateQuestions(questions, minQuestions)) {
    return NextResponse.json(
      {
        error: 'invalid_questions',
        message:
          'Every question needs 4 options, a correct answer, and an explanation — check for any blank fields.',
      },
      { status: 400 }
    );
  }

  const { error: updateError } = await authed.supabase
    .from('published_quizzes')
    .update({
      title: title.trim(),
      description: description ?? null,
      source_url: sourceUrl ?? null,
      topic: topic ?? null,
      emoji: emoji || '📝',
      duration_s: durationS ?? 600,
      pass_mark: passMark ?? 70,
      questions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authed = await getAuthenticatedUser(req);
  if (!authed) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const quiz = await getOwnedQuiz(authed, params.id);
  if (!quiz) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { error: deleteError } = await authed.supabase
    .from('published_quizzes')
    .delete()
    .eq('id', params.id);

  if (deleteError) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  // Drafts never counted against quiz_count, so only decrement for a quiz
  // that was actually published.
  if (quiz.status === 'published') {
    const decremented = await decrementQuizCount(authed.supabase, quiz.publisher_id);
    if (!decremented) {
      console.error('[quiz DELETE] quiz_count failed to decrement for publisher:', quiz.publisher_id);
    }
  }

  return NextResponse.json({ success: true });
}
