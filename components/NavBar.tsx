'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher } from '@/lib/publisher';
import Logo from './Logo';

// Single NavBar for the whole site (M2-03 full-dark redesign) — replaces
// the old LightNavBar/DarkNavBar split now that there's only one theme.

const NAV_LINKS = [
  { label: 'Features', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '/security' },
  { label: 'About', href: '/about' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPublisherProfile, setHasPublisherProfile] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getSupabaseClient()
      .then(async (supabase) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          getPublisher(supabase, session.user.id)
            .then((pub) => setHasPublisherProfile(pub !== null))
            .catch(() => {});
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            getPublisher(supabase, session.user.id)
              .then((pub) => setHasPublisherProfile(pub !== null))
              .catch(() => {});
          } else {
            setHasPublisherProfile(false);
          }
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => setLoading(false));

    return () => unsubscribe?.();
  }, []);

  async function handleSignIn() {
    const supabase = await getSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        // Without this, Google silently reuses the last session with no
        // chooser — a user with multiple Google accounts has no way to
        // switch short of Incognito.
        queryParams: { prompt: 'select_account' },
      },
    });
  }

  async function handleSignOut() {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  }

  return (
    <header className="nav-frosted sticky top-0 z-50">
      <div
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: 1080, height: 64, padding: '0 40px' }}
      >
        <div className="flex-1 flex items-center">
          <Logo size="md" showWordmark={true} href="/" />
        </div>

        <nav className="hidden md:flex items-center" style={{ gap: 28 }}>
          {NAV_LINKS.map((link) => {
            // "Features" is an anchor on the homepage, not its own route —
            // treated as active whenever we're on '/' at all.
            const isActive = link.href === '/#how-it-works' && pathname === '/';
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? 'transition-colors'
                    : 'text-content-secondary hover:text-content-primary transition-colors'
                }
                style={{
                  fontSize: 14,
                  ...(isActive ? { color: '#3E7BFA', fontWeight: 600 } : undefined),
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                title={hasPublisherProfile ? 'Dashboard' : 'Become a publisher'}
                className="hidden sm:inline-block text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                Dashboard
              </Link>
              {user.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.email ?? 'avatar'}
                  className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity shrink-0"
                />
              ) : (
                <span
                  className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center text-sm font-semibold shrink-0"
                >
                  {(user.email ?? '?')[0].toUpperCase()}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm px-3 py-1.5 rounded-md border border-dark-border text-content-secondary hover:border-dark-border2 hover:text-content-primary transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignIn}
                className="text-sm px-4 py-1.5 rounded-md border border-dark-border text-content-secondary hover:border-dark-border2 hover:text-content-primary transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={handleSignIn}
                className="btn-glow text-sm px-4 py-1.5 rounded-md bg-brand-blue text-white font-medium hover:opacity-90 transition-opacity"
              >
                Start for free →
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
