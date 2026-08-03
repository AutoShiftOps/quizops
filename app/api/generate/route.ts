import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSupabase';
import { getPublisher, checkTierLimit } from '@/lib/publisher';

const MAX_WORDS = 6000;
const FREE_TIER_HOURLY_LIMIT = 5;
const HOUR_MS = 60 * 60 * 1000;

// Best-effort in-memory rate limit. Resets on cold start / across serverless
// instances — acceptable for an MVP; a persistent store (Redis, etc.) would
// be needed for a real guarantee.
const requestLog = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < HOUR_MS);
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return timestamps.length > FREE_TIER_HOURLY_LIMIT;
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

function buildSystemPrompt(questionCount: number): string {
  return `You are a technical quiz generator. Generate exactly ${questionCount} multiple-choice questions that test a reader's understanding of the article provided.

Rules:
- Questions must be answerable from the article only
- 4 options per question, exactly one correct
- Wrong options must be plausible, not obviously wrong
- Explanations must reference the article content
- Difficulty: 30% easy, 50% medium, 20% hard
- Output ONLY newline-delimited JSON (NDJSON)
- One complete JSON object per line, no markdown, no preamble, no trailing text

Each line must match this exact schema:
{"id":"q1","text":"...","code":null,"options":["A","B","C","D"],"answer":0,"explanation":"...","tags":["tag"]}`;
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

  if (isRateLimited(authed.user.id)) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: 'Generation limit reached. Upgrade to Pro for unlimited generations.',
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { url, text, questionCount = 10 } = body as {
    url?: string;
    text?: string;
    questionCount?: number;
  };

  let articleText: string;

  if (url) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { 'User-Agent': 'QuizOps/1.0' } });
    } catch {
      return NextResponse.json(
        {
          error: 'fetch_failed',
          message: 'Could not fetch article. Please paste the text instead.',
        },
        { status: 422 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'fetch_failed',
          message: 'Could not fetch article. Please paste the text instead.',
        },
        { status: 422 }
      );
    }
    const html = await res.text();
    articleText = extractTextFromHtml(html);
  } else if (text) {
    articleText = text;
  } else {
    return NextResponse.json({ error: 'missing_input' }, { status: 400 });
  }

  articleText = truncateWords(articleText, MAX_WORDS);

  const systemPrompt = buildSystemPrompt(questionCount);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await openai.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: articleText },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 4000,
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        let buffer = '';
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          buffer += delta;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              JSON.parse(trimmed);
              controller.enqueue(new TextEncoder().encode(trimmed + '\n'));
            } catch {
              // skip malformed lines silently
            }
          }
        }
        if (buffer.trim()) {
          try {
            JSON.parse(buffer.trim());
            controller.enqueue(new TextEncoder().encode(buffer.trim() + '\n'));
          } catch {
            // skip malformed trailing buffer
          }
        }
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
      },
    }
  );
}
