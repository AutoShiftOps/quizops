import type { Metadata } from 'next';

// Not a second root layout — Next.js's App Router only allows one <html>/
// <body> pair per app (a genuine second root layout requires splitting the
// *entire* app into route groups, which one route doesn't warrant). NavBar/
// footer are already suppressed for /embed/* by SiteChrome in the real root
// layout (app/layout.tsx); this nested layout only adds the embed-specific
// background/spacing and the noindex directive.
export const metadata: Metadata = {
  robots: 'noindex',
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#080C14',
        minHeight: '100vh',
        padding: 16,
        fontFamily: '-apple-system, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
