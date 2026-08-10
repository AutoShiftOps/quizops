// Standalone fallback — the real waitlist flow (M2-02) is the modal on
// /pricing now, but this route is left in place in case anything still
// links here directly.
export default function WaitlistPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center" style={{ background: '#080C14' }}>
      <h1 className="font-heading text-3xl font-bold mb-4" style={{ color: '#F1F5F9' }}>
        Pro tier is coming
      </h1>
      <p style={{ color: '#94A3B8' }}>
        Unlimited quizzes, full analytics history, no QuizOps branding, and iFrame embed
        support.{' '}
        <a href="/pricing" className="hover:underline" style={{ color: '#3E7BFA' }}>
          Join the waitlist on the pricing page →
        </a>
      </p>
    </div>
  );
}
