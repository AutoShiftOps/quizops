// Placeholder pending M1-05 (Security + About pages) — exists so the new
// footer's "Security" link doesn't 404. The full page (infrastructure,
// data handling, AI provider disclosure, known open issues, responsible
// disclosure) is scoped to that issue and should render SECURITY.md.
export default function SecurityPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-4">Security</h1>
      <p className="text-[#71717A]">
        Our full security approach — infrastructure, data handling, and responsible
        disclosure — is coming soon. In the meantime, see{' '}
        <a
          href="https://github.com/AutoShiftOps/quizops/blob/main/SECURITY.md"
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          SECURITY.md
        </a>{' '}
        on GitHub.
      </p>
    </div>
  );
}
