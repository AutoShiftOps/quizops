import { getSupabaseClient } from './supabase';

// Fallback for any /api/stripe/checkout error code the route ever returns
// without its own `message` — belt-and-suspenders so a raw code (like the
// "already_pro" string that was bug 1) can never reach the UI unmapped.
const ERROR_MESSAGES: Record<string, string> = {
  already_pro: "You're already on Pro.",
  unauthenticated: 'Please sign in to upgrade to Pro.',
  no_publisher_profile: 'Could not find your publisher profile. Please try again.',
};

// Shared by every "Upgrade to Pro" trigger (M2-01) — centralizes the
// session-token fetch + /api/stripe/checkout call so each caller only needs
// to handle its own loading/error UI state around a single await.
export async function startProCheckout(): Promise<{ url?: string; error?: string }> {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: 'Please sign in to upgrade to Pro.' };
  }

  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) return { url: data.url };
    const code = typeof data.error === 'string' ? data.error : undefined;
    return { error: data.message || (code && ERROR_MESSAGES[code]) || code || 'Something went wrong' };
  } catch {
    return { error: 'Failed to start checkout' };
  }
}
