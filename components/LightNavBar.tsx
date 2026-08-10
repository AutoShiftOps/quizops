'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher } from '@/lib/publisher';
import LoginButton from './LoginButton';
import Logo from './Logo';

// Center marketing nav (added for the enterprise homepage redesign). Hidden
// below md — no hamburger menu was requested, and the right-hand auth
// actions remain reachable at every width.
const NAV_LINKS = [
  { label: 'Features', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '/security' },
  { label: 'About', href: '/about' },
];

// Light-theme NavBar (M1-01) used on marketing + dashboard pages. Dashboard
// is reached via the avatar only — no separate "Dashboard" text link here,
// per the redundant-navigation cleanup (see the publisher strip on the
// homepage and the post-publish share screen for the other two allowed
// entry points).
export default function LightNavBar() {
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

  async function handleSignOut() {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  }

  return (
    // sticky + top-0 + a z-index above page content keeps this visible
    // through scroll — including the "Features" anchor jump to
    // #how-it-works, which previously scrolled the NavBar off-screen along
    // with everything else since it was never actually pinned. (No
    // overflow: hidden/auto exists on any ancestor up to <body> in this
    // codebase — checked (light)/layout.tsx, the root layout, and
    // globals.css — so that wasn't the cause here; the header just needed
    // position: sticky in the first place.)
    <header className="bg-white border-b border-[#E4E4E7] sticky top-0 z-50">
      <div
        className="mx-auto px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ maxWidth: 1080 }}
      >
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center">
            <Logo size="sm" showTagline={false} variant="light" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center" style={{ gap: 28 }}>
          {NAV_LINKS.map((link) => {
            // "Features" is an anchor on the homepage, not its own route, so
            // there's no scroll-position tracking here — just a simple
            // proxy: treat it as active whenever we're on '/' at all.
            const isActive = link.href === '/#how-it-works' && pathname === '/';
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? 'transition-colors hover:font-medium'
                    : 'text-[#71717A] hover:text-[#18181B] hover:font-medium transition-colors'
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

        <div className="flex-1 flex items-center justify-end gap-5">
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                title={hasPublisherProfile ? 'Dashboard' : 'Become a publisher'}
                className="shrink-0"
              >
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.email ?? 'avatar'}
                    className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-semibold hover:bg-accent/20 transition-colors">
                    {(user.email ?? '?')[0].toUpperCase()}
                  </span>
                )}
              </Link>
              <span className="text-sm text-[#71717A] hidden sm:inline">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm px-3 py-1.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LoginButton label="Sign in" variant="ghost" />
              <LoginButton label="Start for free" variant="accent" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
