// Placeholder pending M1-05 (Security + About pages) — exists so the
// homepage's "See how it works" link doesn't 404. Full human-toned bio,
// AutoShiftOps/GitHub links, and contact details are scoped to that issue.
export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-4">About QuizOps</h1>
      <p className="text-[#71717A]">
        Paste an article URL, get 10 quiz questions in under 60 seconds, and see how many
        readers actually understood what you wrote. More about how QuizOps works — and who
        builds it — is coming soon.
      </p>
    </div>
  );
}
