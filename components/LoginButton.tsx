'use client';

import { getSupabaseClient } from '@/lib/supabase';

type Props = {
  label?: string;
  variant?: 'accent' | 'ghost';
};

export default function LoginButton({ label = 'Sign in with Google', variant = 'accent' }: Props) {
  async function handleSignIn() {
    const supabase = await getSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  }

  const className =
    variant === 'ghost'
      ? 'text-sm px-4 py-1.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors'
      : 'text-sm px-4 py-1.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity';

  return (
    <button onClick={handleSignIn} className={className}>
      {label}
    </button>
  );
}
