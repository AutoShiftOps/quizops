import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// This app has no cookie-based session (auth lives entirely in the browser via
// the Supabase JS SDK), so API routes can't infer "who's calling" for free.
// The client must send the user's access token, and we attach it to a fresh
// server-side client so RLS policies evaluate against that user's auth.uid().
export function createServerSupabase(accessToken?: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase env vars not configured');
  }
  return createClient(url, anonKey, {
    global: {
      ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
      // Next.js patches the global fetch in Server Components and caches
      // GET requests by default — including ones issued internally by the
      // Supabase client. Without this, `dynamic = 'force-dynamic'` on a
      // page alone isn't reliably enough to stop reads from serving stale
      // data right after a write (e.g. right after unpublishing/deleting).
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}

export type AuthedRequest = {
  user: User;
  supabase: SupabaseClient;
};

export async function getAuthenticatedUser(req: Request): Promise<AuthedRequest | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const supabase = createServerSupabase(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { user: data.user, supabase };
}
