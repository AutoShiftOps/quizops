import Link from 'next/link';

// New bold CTA section above the footer (enterprise homepage redesign).
// Replaces the old "Have a topic to test?" section on BankGrid.
export default function PublisherCTA() {
  return (
    <section
      className="text-center px-6 md:px-10"
      style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #3E7BFA 100%)',
        paddingTop: 64,
        paddingBottom: 64,
      }}
    >
      <h2
        className="font-heading font-extrabold text-white mx-auto text-[28px] md:text-[36px]"
        style={{ letterSpacing: '-0.8px' }}
      >
        Ready to quiz your readers?
      </h2>
      <p className="mx-auto mt-3" style={{ color: '#BFDBFE', fontSize: 16, maxWidth: 480 }}>
        Join technical writers using QuizOps to add comprehension to their content. Free to
        start, no credit card required.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap mt-7">
        <Link
          href="/dashboard"
          className="bg-white hover:opacity-90 transition-opacity"
          style={{ color: '#1D4ED8', padding: '13px 24px', borderRadius: 9, fontWeight: 700, fontSize: 15 }}
        >
          Start for free →
        </Link>
        <a
          href="mailto:admin@autoshiftops.com"
          className="text-white hover:bg-white/10 transition-colors"
          style={{
            padding: '13px 24px',
            borderRadius: 9,
            fontWeight: 700,
            fontSize: 15,
            border: '1.5px solid rgba(255,255,255,0.4)',
          }}
        >
          Talk to us
        </a>
      </div>
    </section>
  );
}
