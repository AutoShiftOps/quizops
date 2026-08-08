// Placeholder pending M2-02 (Pro waitlist page) — exists so the pricing
// page's "Join Pro waitlist" CTA doesn't 404. The real page (email capture,
// signup counter) is scoped to that issue, in the Growth & Monetisation
// milestone.
export default function WaitlistPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-4">Pro tier is coming</h1>
      <p className="text-[#71717A]">
        Unlimited quizzes, full analytics history, no QuizOps branding, and iFrame embed
        support. Waitlist signup is coming soon — check back shortly.
      </p>
    </div>
  );
}
