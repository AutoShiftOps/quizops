import Link from 'next/link';

// Full-dark homepage hero (M2-03 redesign). Guest and signed-in visitors
// both get the identical hero — personalisation lives in the slim
// announcement bar BankGrid renders above this, not here.

const TRUST_ITEMS = [
  'AI-generated questions',
  'No code needed',
  'Free to start',
  '60 seconds setup',
];

// Hardcoded per spec — these will grow, and can be wired to real Supabase
// counts later.
const STATS = [
  { value: '3', label: 'Quizzes published' },
  { value: '60s', label: 'Avg generation time' },
  { value: '100%', label: 'Free to start' },
  { value: 'GPT-4o', label: 'AI model' },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden text-center flex flex-col items-center justify-center px-6 md:px-10"
      style={{ background: '#080C14', paddingTop: 96, paddingBottom: 40, minHeight: '85vh' }}
    >
      <div className="hero-glow" aria-hidden="true" style={{ zIndex: 0 }} />
      {/* Second, subtler glow in the opposite corner for depth — green
          accent, no animation (the blue one already carries the motion). */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <span
        className="relative z-10 inline-flex items-center mb-6"
        style={{
          gap: 8,
          padding: '5px 14px 5px 8px',
          border: '1px solid rgba(62,123,250,0.3)',
          borderRadius: 20,
          background: 'rgba(62,123,250,0.08)',
        }}
      >
        <span
          className="pulse-dot"
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }}
        />
        <span style={{ color: '#94A3B8', fontSize: 13 }}>Publisher platform · Beta</span>
      </span>

      <h1
        className="relative z-10 font-heading font-extrabold mx-auto text-[40px] md:text-[64px]"
        style={{ letterSpacing: '-2.5px', lineHeight: 1.05, color: '#F1F5F9', maxWidth: 700 }}
      >
        Turn articles into{' '}
        <br className="hidden sm:block" />
        <span className="gradient-text">knowledge tests.</span>
      </h1>

      <p
        className="relative z-10 mx-auto"
        style={{
          color: '#94A3B8',
          fontSize: 18,
          lineHeight: 1.7,
          maxWidth: 520,
          margin: '16px auto 32px',
        }}
      >
        Paste your article URL. AI generates 10 questions in 60 seconds. See exactly how many
        readers understood what you wrote.
      </p>

      <p
        className="relative z-10 flex items-center justify-center flex-wrap gap-x-2 gap-y-1"
        style={{ color: '#475569', fontSize: 13, marginBottom: 36 }}
      >
        {TRUST_ITEMS.map((item, i) => (
          <span key={item} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">·</span>}
            <span>
              <span style={{ color: '#22C55E' }}>✓</span> {item}
            </span>
          </span>
        ))}
      </p>

      <div className="relative z-10 flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/dashboard"
          className="btn-glow rounded-[10px] bg-brand-blue text-white hover:opacity-90 transition-opacity"
          style={{ padding: '14px 28px', fontSize: 15, fontWeight: 700 }}
        >
          Start for free →
        </Link>
        <Link
          href="/#how-it-works"
          className="rounded-[10px] border border-dark-border text-content-secondary hover:border-dark-border2 hover:text-content-primary transition-colors"
          style={{ padding: '14px 24px', fontSize: 15, fontWeight: 700, background: 'transparent' }}
        >
          See how it works
        </Link>
      </div>

      <div
        className="relative z-10 mx-auto flex items-center"
        style={{
          background: '#0F1520',
          border: '1px solid #1E2D45',
          borderRadius: 12,
          maxWidth: 680,
          width: '100%',
          padding: '16px 24px',
          marginTop: 32,
          overflow: 'hidden',
          flexWrap: 'nowrap',
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="text-center flex-1"
            style={{
              minWidth: 0,
              ...(i > 0 ? { borderLeft: '1px solid #1E2D45', paddingLeft: 16, marginLeft: 16 } : undefined),
            }}
          >
            <p
              className="truncate"
              style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9' }}
            >
              {stat.value}
            </p>
            <p className="truncate" style={{ fontSize: 12, color: '#475569' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
