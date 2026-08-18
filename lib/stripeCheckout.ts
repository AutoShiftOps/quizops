import { getSupabaseClient } from './supabase';

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
    return { error: data.message || data.error || 'Something went wrong' };
  } catch {
    return { error: 'Failed to start checkout' };
  }
}
