import Link from 'next/link';

// Guest-only marketing hero (enterprise homepage redesign). Rendered by
// BankGrid in place of the old inline guest hero — signed-in users still get
// the compact personalised header (see BankGrid.tsx), this is the
// full-bleed pitch for anonymous visitors.

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
      className="text-center px-6 md:px-10"
      style={{
        background: 'linear-gradient(180deg, #fff 0%, #F8FAFF 100%)',
        borderBottom: '1px solid #E4E4E7',
        paddingTop: 80,
        paddingBottom: 64,
      }}
    >
      <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] mb-5">
        Publisher platform for technical writers
      </span>

      <h1
        className="font-heading font-extrabold mx-auto text-[36px] md:text-[52px]"
        style={{ letterSpacing: '-2px', lineHeight: 1.1, color: '#18181B', maxWidth: 680 }}
      >
        Turn articles into <span style={{ color: '#3E7BFA' }}>knowledge tests</span>.
      </h1>

      <p className="mx-auto mt-4" style={{ fontSize: 18, color: '#71717A', maxWidth: 520, marginBottom: 28 }}>
        Paste your article URL. Get 10 quiz questions in 60 seconds. See exactly how many
        readers understood what you wrote.
      </p>

      <p
        className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 mb-7"
        style={{ fontSize: 13, color: '#71717A' }}
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

      <div className="flex items-center justify-center gap-3 flex-wrap" style={{ marginBottom: 48 }}>
        <Link
          href="/dashboard"
          className="rounded-md bg-accent text-white hover:opacity-90 transition-opacity"
          style={{
            padding: '14px 28px',
            fontSize: 15,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(62,123,250,0.3)',
          }}
        >
          Start for free →
        </Link>
        <Link
          href="/pricing"
          className="rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
          style={{ padding: '14px 28px', fontSize: 15, fontWeight: 700 }}
        >
          View pricing
        </Link>
      </div>

      <div
        className="mx-auto flex flex-wrap items-center justify-center"
        style={{
          background: '#F8FAFF',
          border: '1px solid #E4E4E7',
          borderRadius: 12,
          maxWidth: 680,
          padding: '20px 40px',
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="text-center"
            style={i > 0 ? { borderLeft: '1px solid #E4E4E7', paddingLeft: 40, marginLeft: 40 } : undefined}
          >
            <p style={{ fontSize: 26, fontWeight: 800, color: '#18181B' }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: '#71717A' }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
