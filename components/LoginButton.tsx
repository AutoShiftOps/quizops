'use client';

import { getSupabaseClient } from '@/lib/supabase';

export default function LoginButton() {
  async function handleSignIn() {
    const supabase = await getSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  }

  return (
    <button
      onClick={handleSignIn}
      className="text-sm px-4 py-1.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
    >
      Sign in with Google
    </button>
  );
}
