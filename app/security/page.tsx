import { Metadata } from 'next';
import PageContainer from '@/components/PageContainer';

export const metadata: Metadata = {
  title: 'Security | QuizOps',
};

const TRUST_BADGES = ['🔒 HTTPS only', '🛡️ RLS enforced', '🏗️ Vercel + Supabase'];

const INFRA_CARDS = [
  { icon: '🌐', title: 'Hosting', desc: 'Vercel edge network with DDoS protection' },
  { icon: '🗄️', title: 'Database', desc: 'Supabase PostgreSQL, encrypted at rest' },
  { icon: '🔑', title: 'Auth', desc: 'Google OAuth via Supabase Auth' },
  { icon: '🔐', title: 'Data access', desc: 'Row-Level Security — users see only their own data' },
];

const DATA_ROWS = [
  { data: 'Email, name', where: 'Supabase', retention: 'Until account deleted' },
  { data: 'Quiz scores', where: 'Supabase', retention: 'Until account deleted' },
  { data: 'Article URLs', where: 'Supabase', retention: 'Until quiz deleted' },
  { data: 'Article text', where: 'OpenAI API only', retention: 'Not stored by QuizOps' },
];

export default function SecurityPage() {
  return (
    <div style={{ background: '#080C14' }}>
      <section className="text-center" style={{ padding: '48px 40px 40px' }}>
        <div
          className="mx-auto mb-4 flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(62,123,250,0.12)', fontSize: 22 }}
        >
          🔒
        </div>
        <h1 className="font-heading text-3xl font-bold mb-2" style={{ color: '#F1F5F9' }}>
          Security
        </h1>
        <p className="max-w-md mx-auto mb-6" style={{ color: '#94A3B8' }}>
          We use industry-standard infrastructure. Here is exactly what we do and do not store.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TRUST_BADGES.map((label) => (
            <span
              key={label}
              className="inline-block"
              style={{
                fontSize: 12,
                borderRadius: 20,
                padding: '4px 12px',
                background: 'rgba(62,123,250,0.08)',
                border: '1px solid rgba(62,123,250,0.3)',
                color: '#94A3B8',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <PageContainer className="pb-16">
        <section className="mb-12">
          <h2 className="font-heading text-xl font-semibold mb-4" style={{ color: '#F1F5F9' }}>
            Infrastructure
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INFRA_CARDS.map((card) => (
              <div key={card.title} className="dark-card" style={{ padding: 16 }}>
                <p className="font-medium mb-1" style={{ color: '#F1F5F9' }}>
                  {card.icon} {card.title}
                </p>
                <p className="text-sm" style={{ color: '#94A3B8' }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-xl font-semibold mb-4" style={{ color: '#F1F5F9' }}>
            Data we store
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse', border: '1px solid #1E2D45' }}>
              <thead>
                <tr style={{ background: '#161D2E' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, border: '1px solid #1E2D45', color: '#F1F5F9' }}>
                    Data
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, border: '1px solid #1E2D45', color: '#F1F5F9' }}>
                    Where
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, border: '1px solid #1E2D45', color: '#F1F5F9' }}>
                    Retention
                  </th>
                </tr>
              </thead>
              <tbody>
                {DATA_ROWS.map((row, i) => (
                  <tr key={row.data} style={{ background: i % 2 === 0 ? '#0F1520' : '#0D1420' }}>
                    <td style={{ padding: '12px 16px', border: '1px solid #1E2D45', color: '#94A3B8' }}>{row.data}</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #1E2D45', color: '#94A3B8' }}>{row.where}</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #1E2D45', color: '#94A3B8' }}>
                      {row.retention}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: 20 }}>
            <p className="font-heading font-semibold mb-2" style={{ color: '#F1F5F9' }}>
              ⚡ AI Provider
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              Quiz questions are generated via OpenAI&apos;s API. Your article text is sent to
              OpenAI for processing only — QuizOps does not store it after generation.
            </p>
          </div>
        </section>

        <section className="mb-12">
          {/* Same amber card style, lighter tint — de-emphasised relative to
              the AI disclosure above since these are lower-severity items. */}
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: 20 }}>
            <p className="font-heading font-semibold mb-2" style={{ color: '#F1F5F9' }}>
              Known Open Issues
            </p>
            <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>
              We believe in transparency. Current known issues:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: '#94A3B8' }}>
              <li>
                Next.js framework CVEs (14.x) — assessed as low risk given our hosting
                configuration. Upgrade to Next.js 16 is scheduled.
              </li>
              <li>No SOC 2 certification yet (planned for Enterprise tier launch)</li>
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-heading text-base font-semibold mb-2" style={{ color: '#F1F5F9' }}>
              Status
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8' }} className="mb-2">
              <span style={{ color: '#22C55E' }}>●</span> All systems operational
            </p>
            <a
              href="https://status.autoshiftops.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-sm"
              style={{ color: '#3E7BFA' }}
            >
              View real-time status →
            </a>
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold mb-2" style={{ color: '#F1F5F9' }}>
              Responsible disclosure
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              Found a security issue? Email{' '}
              <a href="mailto:admin@autoshiftops.com" className="hover:underline" style={{ color: '#3E7BFA' }}>
                admin@autoshiftops.com
              </a>{' '}
              before public disclosure. We aim to respond within 48 hours.
            </p>
          </div>
        </section>

        <p className="text-sm text-center" style={{ color: '#475569' }}>
          Full source and change history:{' '}
          <a
            href="https://github.com/AutoShiftOps/quizops/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: '#3E7BFA' }}
          >
            SECURITY.md on GitHub
          </a>
        </p>
      </PageContainer>
    </div>
  );
}
