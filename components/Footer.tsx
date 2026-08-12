export default function Footer() {
  return (
    <footer style={{ background: '#080C14', borderTop: '1px solid #1E2D45', padding: '24px 40px' }}>
      <div
        className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center"
        style={{ maxWidth: 1080 }}
      >
        <p style={{ fontSize: 13, color: '#94A3B8' }}>© 2026 QuizOps by AutoShiftOps</p>
        <nav className="flex flex-wrap items-center justify-center gap-4" style={{ fontSize: 13 }}>
          <a href="/legal/terms" className="hover:underline" style={{ color: '#3E7BFA' }}>
            Terms
          </a>
          <a href="/legal/privacy" className="hover:underline" style={{ color: '#3E7BFA' }}>
            Privacy
          </a>
          <a href="/security" className="hover:underline" style={{ color: '#3E7BFA' }}>
            Security
          </a>
          <a href="/about" className="hover:underline" style={{ color: '#3E7BFA' }}>
            About
          </a>
          <a href="/pricing" className="hover:underline" style={{ color: '#3E7BFA' }}>
            Pricing
          </a>
          <a
            href="https://status.autoshiftops.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline inline-flex items-center gap-1"
            style={{ color: '#3E7BFA' }}
          >
            Status <span style={{ color: '#22C55E' }}>●</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
