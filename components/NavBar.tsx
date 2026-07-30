'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import LoginButton from './LoginButton';
import Logo from './Logo';

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getSupabaseClient()
      .then(async (supabase) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => setLoading(false));

    return () => unsubscribe?.();
  }, []);

  async function handleSignOut() {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  }

  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size="sm" showTagline={false} />
        </Link>

        <div>
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.email ?? 'avatar'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-400 hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm px-3 py-1.5 rounded-md border border-border hover:border-accent transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  );
}
