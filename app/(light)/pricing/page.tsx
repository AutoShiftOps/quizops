import Link from 'next/link';

// Placeholder pending M1-03 (Pricing page) — exists so the new NavBar's
// "Pricing" link and homepage CTA don't 404. Full three-tier layout,
// FAQ, and annual/monthly toggle are scoped to that issue.
export default function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-4">Pricing</h1>
      <p className="text-[#71717A] mb-8">
        Full pricing details are coming soon. In the meantime, QuizOps is free to start —
        3 published quizzes, AI generation, and basic analytics included.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
      >
        Start for free →
      </Link>
    </div>
  );
}
