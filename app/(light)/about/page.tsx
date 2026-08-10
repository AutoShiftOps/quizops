import { Metadata } from 'next';
import PageContainer from '@/components/PageContainer';

export const metadata: Metadata = {
  title: 'About QuizOps | QuizOps',
};

const STATS = [
  { value: '66+', label: 'Articles published' },
  { value: '13+', label: 'Years in DevOps & Cloud' },
  { value: '2026', label: 'QuizOps founded' },
];

const LINKS = [
  { icon: '🌐', href: 'https://autoshiftops.com', label: 'autoshiftops.com', desc: 'personal site + articles' },
  {
    icon: '💻',
    href: 'https://github.com/AutoShiftOps/quizops',
    label: 'github.com/AutoShiftOps/quizops',
    desc: 'open source',
  },
  { icon: '✉️', href: 'mailto:admin@autoshiftops.com', label: 'admin@autoshiftops.com', desc: 'contact' },
];

export default function AboutPage() {
  return (
    <div>
      <section className="text-center" style={{ padding: '48px 40px 40px' }}>
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: '#EFF6FF' }}
        >
          <span style={{ color: '#3E7BFA', fontSize: 24, fontWeight: 700 }}>SS</span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-2">About QuizOps</h1>
        <p style={{ color: '#71717A', fontSize: 14 }}>
          Built by Sudhakar Sajja · Application Architect · Mississauga, Canada
        </p>
      </section>

      <PageContainer className="pb-16">
        {/* Story text kept exactly as written — the closing signature block
            that used to repeat the name/title/location here was folded
            into the hero byline above instead, so it isn't said twice. */}
        <div
          className="mx-auto"
          style={{ maxWidth: 600, fontSize: 16, lineHeight: 1.8, color: '#18181B' }}
        >
          <p className="mb-5">QuizOps started with a simple frustration.</p>
          <p className="mb-5">
            I publish technical articles on AutoShiftOps — guides on DevOps, cloud
            infrastructure, and AI-powered operations. After writing 66+ articles, I realised I
            had no idea whether readers actually understood what I wrote. Page views told me
            nothing about comprehension.
          </p>
          <p className="mb-5">So I built QuizOps.</p>
          <p>
            Paste your article URL. Get 10 quiz questions in 60 seconds. Share the link with
            your readers. See who understood — and which parts they missed.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mx-auto mt-10 mb-12" style={{ maxWidth: 600 }}>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[#E4E4E7] text-center"
              style={{ borderRadius: 10, padding: 16 }}
            >
              <p style={{ fontSize: 28, fontWeight: 800, color: '#18181B' }}>{stat.value}</p>
              <p className="text-xs text-[#71717A] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto space-y-2 mb-10" style={{ maxWidth: 600 }}>
          {LINKS.map((link) => {
            const external = link.href.startsWith('http');
            return (
              <a
                key={link.href}
                href={link.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="flex items-center bg-white border border-[#E4E4E7] hover:border-[#3E7BFA] transition-colors"
                style={{ borderRadius: 8, padding: '12px 16px', gap: 10 }}
              >
                <span>{link.icon}</span>
                <span className="text-accent font-medium">{link.label}</span>
                <span className="text-[#71717A] text-sm">— {link.desc}</span>
              </a>
            );
          })}
        </div>

        <p className="text-sm text-[#71717A] leading-relaxed mx-auto text-center" style={{ maxWidth: 600 }}>
          QuizOps is open source. The quiz engine is MIT licensed. Enterprise features are
          proprietary. Contributions to quiz banks are welcome — see{' '}
          <a
            href="https://github.com/AutoShiftOps/quizops/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            CONTRIBUTING.md
          </a>
          .
        </p>
      </PageContainer>
    </div>
  );
}
