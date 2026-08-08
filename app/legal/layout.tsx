import Link from 'next/link';

// Minimal standalone layout for legal pages — deliberately lighter chrome
// than the rest of the site (no full NavBar), just a way back and good
// reading typography. The root layout already provides the light
// background/text default.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[760px] mx-auto" style={{ padding: '48px 24px' }}>
      <Link
        href="/"
        className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
      >
        ← quiz.autoshiftops.com
      </Link>
      <article className="mt-8">{children}</article>
    </div>
  );
}
