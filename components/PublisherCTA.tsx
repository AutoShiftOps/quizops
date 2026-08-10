import Link from 'next/link';

// Bold CTA section above the footer (M2-03: dark gradient replaces the old
// blue gradient). Renders on BankGrid unless the visitor is already a
// publisher (who gets the "top quiz this week" strip instead).
export default function PublisherCTA() {
  return (
    <section
      className="relative overflow-hidden text-center px-6 md:px-10"
      style={{
        background: 'linear-gradient(135deg, #080C14 0%, #0D1829 50%, #080C14 100%)',
        borderBottom: '1px solid #1E2D45',
        paddingTop: 64,
        paddingBottom: 64,
      }}
    >
      <div className="hero-glow" aria-hidden="true" style={{ top: '50%', marginTop: -200 }} />

      <h2
        className="relative font-heading font-extrabold mx-auto text-[28px] md:text-[36px]"
        style={{ letterSpacing: '-0.8px', color: '#F1F5F9' }}
      >
        Ready to quiz your readers?
      </h2>
      <p className="relative mx-auto mt-3" style={{ color: '#94A3B8', fontSize: 16, maxWidth: 480 }}>
        Join technical writers using QuizOps to add comprehension to their content. Free to
        start, no credit card required.
      </p>
      <div className="relative flex items-center justify-center gap-3 flex-wrap mt-7">
        <Link
          href="/dashboard"
          className="btn-glow rounded-[10px] bg-brand-blue text-white hover:opacity-90 transition-opacity"
          style={{ padding: '13px 24px', fontWeight: 700, fontSize: 15 }}
        >
          Start for free →
        </Link>
        <a
          href="mailto:admin@autoshiftops.com"
          className="rounded-[10px] border border-dark-border text-content-secondary hover:border-dark-border2 hover:text-content-primary transition-colors"
          style={{ padding: '13px 24px', fontWeight: 700, fontSize: 15 }}
        >
          Talk to us
        </a>
      </div>
    </section>
  );
}
