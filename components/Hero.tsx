import { Fragment } from 'react';
import Link from 'next/link';

// Full-dark homepage hero (M2-03 redesign). Guest and signed-in visitors
// get the identical hero content — personalisation lives in the slim
// announcement bar BankGrid renders above this, not here. Top padding is
// the one thing that varies: smaller when that welcome bar is already
// sitting above the hero, larger when it isn't, so vertical spacing stays
// balanced either way.

const TRUST_ITEMS = [
  'AI-generated questions',
  'No code needed',
  'Free to start',
  '60 seconds setup',
];

// Answers the 3 questions dev.to readers said the hero didn't: whose
// article (yours), what the reader gets (a quiz), what signal comes back
// (a comprehension report). Text-only — a prior icon version had
// inconsistent emoji rendering across platforms/browsers.
const FLOW_STEPS = ['Your article', 'AI quiz', 'Comprehension data'];

// Hardcoded per spec — these will grow, and can be wired to real Supabase
// counts later.
const STATS = [
  { value: '3', label: 'Quizzes published' },
  { value: '60s', label: 'Avg generation time' },
  { value: '100%', label: 'Free to start' },
  { value: 'GPT-4o', label: 'AI model' },
];

export default function Hero({ isSignedIn = false }: { isSignedIn?: boolean }) {
  return (
    <section
      className="relative overflow-hidden text-center flex flex-col items-center justify-center px-6 md:px-10"
      style={{
        background: '#080C14',
        paddingTop: isSignedIn ? 32 : 64,
        paddingBottom: 40,
        minHeight: '85vh',
      }}
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
        Paste your article URL. AI builds a quiz in 60 seconds. Share it with your readers. Get
        back question-level data showing exactly what they understood — and what they missed.
      </p>

      {/* Flow line — one line on desktop (nowrap), wraps freely on mobile
          (< 640px, Tailwind's `sm`) since forcing nowrap there would
          overflow the viewport. */}
      <div
        className="relative z-10 flex flex-wrap sm:flex-nowrap items-center justify-center"
        style={{ gap: 6, margin: '20px auto', maxWidth: 600 }}
      >
        {FLOW_STEPS.map((step, i) => (
          <Fragment key={step}>
            <span
              style={{
                padding: '6px 16px',
                background: '#0F1520',
                border: '1px solid #1E2D45',
                borderRadius: 20,
                fontSize: 13,
                color: '#94A3B8',
                whiteSpace: 'nowrap',
              }}
            >
              {step}
            </span>
            {i < FLOW_STEPS.length - 1 && (
              <span style={{ color: '#3E7BFA', fontSize: 16 }}>→</span>
            )}
          </Fragment>
        ))}
      </div>

      <div
        className="relative z-10 flex flex-wrap justify-center"
        style={{ gap: '8px 24px', marginBottom: 36 }}
      >
        {TRUST_ITEMS.map((item) => (
          <span key={item} style={{ color: '#475569', fontSize: 13 }}>
            <span style={{ color: '#22C55E' }}>✓</span> {item}
          </span>
        ))}
      </div>

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
