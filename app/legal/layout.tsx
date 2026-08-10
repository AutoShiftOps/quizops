import Link from 'next/link';

// Minimal standalone layout for legal pages — deliberately lighter chrome
// than the rest of the site (no full NavBar), just a way back and good
// reading typography.
//
// Outer wrapper respects the site-wide 1080px container (same constraint as
// every other marketing page); the article itself stays nested inside its
// own narrower 760px reading column, since a legal document set at full
// 1080px width would produce uncomfortably long text lines — the 1080 cap
// and the 760 reading width solve different problems, not conflicting ones.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 1080, padding: '48px 40px', background: '#080C14' }}>
      <div className="max-w-[760px] mx-auto">
        <Link
          href="/"
          className="text-sm hover:text-content-primary transition-colors"
          style={{ color: '#94A3B8' }}
        >
          ← quiz.autoshiftops.com
        </Link>
        <article className="mt-8">{children}</article>
      </div>
    </div>
  );
}
