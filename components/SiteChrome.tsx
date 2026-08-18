'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import Footer from './Footer';

// /embed/* pages (M3-05 iFrame embed) render standalone inside a
// publisher's iframe — no NavBar, no footer, no external navigation. A
// pathname check here (rather than a second root layout) is what keeps the
// single <html>/<body> the App Router requires: Next.js only allows
// multiple root layouts if the *entire* app is split into route groups,
// which one route doesn't warrant restructuring for.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbed = pathname?.startsWith('/embed/');

  if (isEmbed) return <>{children}</>;

  return (
    <>
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
