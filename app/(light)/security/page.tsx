import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security | QuizOps',
};

export default function SecurityPage() {
  return (
    <div className="max-w-[760px] mx-auto px-6" style={{ padding: '48px 24px' }}>
      <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-2">Security</h1>
      <p className="text-[#71717A] mb-10">
        How we protect your data and what we&apos;re honest about.
      </p>

      <section className="mb-10">
        <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-3">Our approach</h2>
        <p className="text-[#3F3F46] leading-relaxed">
          QuizOps is built with security as a default, not an afterthought. We use
          industry-standard infrastructure and are transparent about our security posture.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-3">Infrastructure</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-[#3F3F46]">
          <li>Hosted on Vercel (edge network, DDoS protection)</li>
          <li>Database: Supabase (PostgreSQL, encrypted at rest)</li>
          <li>Authentication: Google OAuth via Supabase Auth</li>
          <li>All connections: HTTPS/TLS only</li>
          <li>Row-Level Security: users access only their own data</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-3">Data we store</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-[#E4E4E7]">
              <tr>
                <th className="text-left font-semibold text-[#18181B] py-2 pr-4">Data</th>
                <th className="text-left font-semibold text-[#18181B] py-2 pr-4">Where</th>
                <th className="text-left font-semibold text-[#18181B] py-2 pr-4">Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">Email, name</td>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">Supabase</td>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">
                  Until account deleted
                </td>
              </tr>
              <tr>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">Quiz scores</td>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">Supabase</td>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">
                  Until account deleted
                </td>
              </tr>
              <tr>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">Article URLs</td>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">Supabase</td>
                <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">
                  Until quiz deleted
                </td>
              </tr>
              <tr>
                <td className="text-[#3F3F46] py-2 pr-4">Article text</td>
                <td className="text-[#3F3F46] py-2 pr-4">OpenAI API only</td>
                <td className="text-[#3F3F46] py-2 pr-4">Not stored by QuizOps</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-3">AI provider</h2>
        <p className="text-[#3F3F46] leading-relaxed">
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
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-3">
          Known open issues
        </h2>
        <p className="text-[#3F3F46] leading-relaxed mb-3">
          We believe in transparency. Current known issues:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[#3F3F46]">
          <li>
            Next.js framework CVEs (14.x) — assessed as low risk given our hosting
            configuration. Upgrade to Next.js 16 is scheduled.
          </li>
          <li>No SOC 2 certification yet (planned for Enterprise tier launch)</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-3">
          Responsible disclosure
        </h2>
        <p className="text-[#3F3F46] leading-relaxed">
          Found a security issue? Please email{' '}
          <a href="mailto:admin@autoshiftops.com" className="text-accent hover:underline">
            admin@autoshiftops.com
          </a>{' '}
          before public disclosure. We aim to respond within 48 hours.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-[#18181B] mb-3">Status</h2>
        <p className="text-[#3F3F46] leading-relaxed">
          Real-time uptime:{' '}
          <span className="text-[#A1A1AA]">status page coming soon (UptimeRobot)</span>
        </p>
        <p className="text-sm text-[#71717A] mt-6">
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
      </section>
    </div>
  );
}
