export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E4E4E7] mt-auto" style={{ padding: '24px 40px' }}>
      <div
        className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center"
        style={{ maxWidth: 1080 }}
      >
        <p style={{ fontSize: 13, color: '#71717A' }}>© 2026 QuizOps by AutoShiftOps</p>
        <nav className="flex flex-wrap items-center justify-center gap-4" style={{ fontSize: 13 }}>
          <a href="/legal/terms" className="text-[#3E7BFA] hover:underline">
            Terms
          </a>
          <a href="/legal/privacy" className="text-[#3E7BFA] hover:underline">
            Privacy
          </a>
          <a href="/security" className="text-[#3E7BFA] hover:underline">
            Security
          </a>
          <a href="/about" className="text-[#3E7BFA] hover:underline">
            About
          </a>
          <a href="/pricing" className="text-[#3E7BFA] hover:underline">
            Pricing
          </a>
          <a
            href="https://stats.uptimerobot.com/ri4adm0vP1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3E7BFA] hover:underline inline-flex items-center gap-1"
          >
            Status <span style={{ color: '#22C55E' }}>●</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
