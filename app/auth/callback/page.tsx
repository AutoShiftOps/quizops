'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

// Dedicated OAuth landing target (Bug A fix) — Supabase's implicit flow
// redirects back here with #access_token=... in the URL hash. Before this
// route existed, signInWithOAuth's redirectTo pointed straight at bare
// pages ('/' or '/dashboard'); whichever component happened to call
// getSupabaseClient() first would (eventually) consume the hash via
// Supabase's own detectSessionInUrl, but getSupabaseClient() here is async
// (it fetches /api/config before ever constructing the client), so there
// was a real window where the hash could still be visibly sitting in the
// address bar with nothing guaranteed to clean it up promptly.
//
// This page's only job is to be the one deterministic place that: waits
// for the client to finish initializing (getSession() awaits Supabase's
// internal init, which includes hash parsing), then does a clean
// router.replace() — an entirely new URL, so the hash can't survive
// regardless of Supabase's own cleanup timing. Destination logic (new vs.
// returning publisher) stays centralized in dashboard/page.tsx +
// PublisherOnboarding, not duplicated here — this always lands on
// /dashboard, which already redirects new signups into /dashboard/new
// once onboarding completes.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = await getSupabaseClient();
      await supabase.auth.getSession();
      if (!cancelled) router.replace('/dashboard');
    })().catch(() => {
      if (!cancelled) router.replace('/');
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <div className="mt-16 text-center text-[#94A3B8] text-sm">Signing you in…</div>;
}
