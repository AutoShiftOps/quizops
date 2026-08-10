import Link from 'next/link';

// Minimal standalone layout for legal pages — deliberately lighter chrome
// than the rest of the site (no full NavBar), just a way back and good
// reading typography. The root layout already provides the light
// background/text default.
//
// Outer wrapper respects the site-wide 1080px container (UI polish pass —
// same constraint as every other marketing page); the article itself stays
// nested inside its own narrower 760px reading column, since a legal
// document set at full 1080px width would produce uncomfortably long text
// lines — the 1080 cap and the 760 reading width aren't in conflict, they
// solve different problems.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 1080, padding: '48px 40px' }}>
      <div className="max-w-[760px] mx-auto">
        <Link
          href="/"
          className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
        >
          ← quiz.autoshiftops.com
        </Link>
        <article className="mt-8">{children}</article>
      </div>
    </div>
  );
}
