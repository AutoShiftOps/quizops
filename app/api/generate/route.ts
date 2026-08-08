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

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTextFromHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. <title> tag (strip a trailing " | Site Name" / " – Site Name" /
//    " - Site Name" suffix), 2. first <h1>, 3. first <h2>, else null.
function extractTitleFromHtml(html: string): string | null {
  const clean = (raw: string) =>
    decodeEntities(raw.replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const full = clean(titleMatch[1]);
    const stripped = full.split(/\s[|–-]\s/)[0].trim();
    if (stripped) return stripped;
  }

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const text = clean(h1Match[1]);
    if (text) return text;
  }

  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) {
    const text = clean(h2Match[1]);
    if (text) return text;
  }

  return null;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

type ModerationResult = { ok: boolean; reason?: string };

// Best-effort JSON parse: the moderation prompts ask for "ONLY valid JSON",
// and gpt-4o-mini at temperature 0 is reliably compliant, but a stray code
// fence or leading word would otherwise throw and incorrectly block (or
// silently pass) real content. Falls back to extracting the first {...}
// block before giving up.
function parseModerationJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw.trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    return {};
  }
}

// Layer 1 — domain intent check, run before ever fetching the URL.
async function checkDomainAllowed(openai: OpenAI, domain: string): Promise<ModerationResult> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Is the domain "${domain}" likely to contain adult content, gambling, hate speech, violence, or illegal material?\nReply with ONLY valid JSON:\n{"allowed": true} or {"allowed": false, "reason": "..."}`,
        },
      ],
      max_tokens: 50,
      temperature: 0,
    });
    const parsed = parseModerationJson(res.choices[0]?.message?.content ?? '');
    if (parsed.allowed === false) {
      return { ok: false, reason: typeof parsed.reason === 'string' ? parsed.reason : undefined };
    }
    return { ok: true };
  } catch (err) {
    // Fail open: a hiccup in this secondary safety check shouldn't take down
    // the primary generation feature for every user. Logged so a spike in
    // failures here is visible/monitorable rather than silently degrading.
    console.error('[generate] domain moderation check failed, defaulting to allowed:', err);
    return { ok: true };
  }
}

// Layer 2 — content classification, run after extracting article text and
// before generation.
async function checkContentAppropriate(openai: OpenAI, articleText: string): Promise<ModerationResult> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Is the following content appropriate for educational quiz generation? It must be informational, technical, or educational. Not adult, violent, or harmful.\nReply ONLY: {"appropriate": true} or {"appropriate": false, "reason": "..."}\n\nContent (first 500 chars):\n${articleText.slice(0, 500)}`,
        },
      ],
      max_tokens: 50,
      temperature: 0,
    });
    const parsed = parseModerationJson(res.choices[0]?.message?.content ?? '');
    if (parsed.appropriate === false) {
      return { ok: false, reason: typeof parsed.reason === 'string' ? parsed.reason : undefined };
    }
    return { ok: true };
  } catch (err) {
    console.error('[generate] content moderation check failed, defaulting to allowed:', err);
    return { ok: true };
  }
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

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let articleText: string;
  let extractedTitle: string | null = null;

  if (url) {
    // Layer 1 — domain intent check, before ever fetching the URL.
    let domain = url;
    try {
      domain = new URL(url).hostname;
    } catch {
      // Malformed URL — let the fetch below produce the normal fetch_failed
      // error rather than a moderation-shaped one.
    }
    const domainCheck = await checkDomainAllowed(openai, domain);
    if (!domainCheck.ok) {
      return NextResponse.json(
        {
          error: 'content_not_allowed',
          message: 'This content is not eligible for quiz generation on QuizOps.',
          reason: domainCheck.reason,
        },
        { status: 422 }
      );
    }

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
    extractedTitle = extractTitleFromHtml(html);
    articleText = extractTextFromHtml(html);
  } else if (text) {
    articleText = text;
  } else {
    return NextResponse.json({ error: 'missing_input' }, { status: 400 });
  }

  articleText = truncateWords(articleText, MAX_WORDS);

  // Layer 2 — content classification, after extracting article text and
  // before spending tokens on generation.
  const contentCheck = await checkContentAppropriate(openai, articleText);
  if (!contentCheck.ok) {
    return NextResponse.json(
      {
        error: 'content_not_appropriate',
        message: "This content isn't eligible for quiz generation.",
        reason: contentCheck.reason,
      },
      { status: 422 }
    );
  }

  const systemPrompt = buildSystemPrompt(questionCount);

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
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ __meta__: true, title: extractedTitle }) + '\n'
          )
        );

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
