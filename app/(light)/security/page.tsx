import { Metadata } from 'next';
import PageContainer from '@/components/PageContainer';

export const metadata: Metadata = {
  title: 'Security | QuizOps',
};

// Structured component, not react-markdown — this page needs cards, a
// styled table, and a two-column layout that plain markdown can't express.
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
    <div>
      <section className="text-center" style={{ padding: '48px 40px 40px' }}>
        <div
          className="mx-auto mb-4 flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', fontSize: 22 }}
        >
          🔒
        </div>
        <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-2">Security</h1>
        <p className="text-[#71717A] max-w-md mx-auto mb-6">
          How we protect your data and what we&apos;re honest about.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TRUST_BADGES.map((label) => (
            <span
              key={label}
              className="inline-block bg-[#EFF6FF] text-[#1D4ED8]"
              style={{ fontSize: 12, borderRadius: 20, padding: '4px 12px', border: '1px solid #BFDBFE' }}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <PageContainer className="pb-16">
        <section className="mb-12">
          <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-4">Infrastructure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INFRA_CARDS.map((card) => (
              <div
                key={card.title}
                className="bg-white border border-[#E4E4E7]"
                style={{ borderRadius: 12, padding: 16 }}
              >
                <p className="font-medium text-[#18181B] mb-1">
                  {card.icon} {card.title}
                </p>
                <p className="text-sm text-[#71717A]">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-4">Data we store</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse', border: '1px solid #E4E4E7' }}>
              <thead>
                <tr style={{ background: '#F4F4F5' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, border: '1px solid #E4E4E7', color: '#18181B' }}>
                    Data
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, border: '1px solid #E4E4E7', color: '#18181B' }}>
                    Where
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, border: '1px solid #E4E4E7', color: '#18181B' }}>
                    Retention
                  </th>
                </tr>
              </thead>
              <tbody>
                {DATA_ROWS.map((row, i) => (
                  <tr key={row.data} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '12px 16px', border: '1px solid #E4E4E7', color: '#3F3F46' }}>{row.data}</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #E4E4E7', color: '#3F3F46' }}>{row.where}</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #E4E4E7', color: '#3F3F46' }}>
                      {row.retention}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 20 }}>
            <p className="font-heading font-semibold text-[#18181B] mb-2">⚡ AI Provider Disclosure</p>
            <p className="text-sm text-[#3F3F46] leading-relaxed">
              Quiz questions are generated via OpenAI&apos;s API. Article text is sent to OpenAI
              for processing and is not stored by QuizOps after generation. OpenAI&apos;s data
              handling:{' '}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                openai.com/policies/privacy-policy
              </a>
            </p>
          </div>
        </section>

        <section className="mb-12">
          {/* Same amber card style, lighter tint — de-emphasised relative to
              the AI disclosure above since these are lower-severity items. */}
          <div style={{ background: '#FFFDF6', border: '1px solid #FEF3C7', borderRadius: 10, padding: 20 }}>
            <p className="font-heading font-semibold text-[#18181B] mb-2">Known Open Issues</p>
            <p className="text-sm text-[#3F3F46] mb-2">We believe in transparency. Current known issues:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#3F3F46]">
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
            <h2 className="font-heading text-base font-semibold text-[#18181B] mb-2">Status</h2>
            <p style={{ fontSize: 14 }} className="text-[#3F3F46] mb-2">
              <span style={{ color: '#22C55E' }}>●</span> All systems operational
            </p>
            <a
              href="https://stats.uptimerobot.com/ri4adm0vP1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3E7BFA] hover:underline text-sm"
            >
              View real-time status →
            </a>
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-[#18181B] mb-2">
              Responsible disclosure
            </h2>
            <p className="text-sm text-[#3F3F46] leading-relaxed">
              Found a security issue? Email{' '}
              <a href="mailto:admin@autoshiftops.com" className="text-accent hover:underline">
                admin@autoshiftops.com
              </a>{' '}
              before public disclosure. We aim to respond within 48 hours.
            </p>
          </div>
        </section>

        <p className="text-sm text-[#71717A] text-center">
          Full source and change history:{' '}
          <a
            href="https://github.com/AutoShiftOps/quizops/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            SECURITY.md on GitHub
          </a>
        </p>
      </PageContainer>
    </div>
  );
}
