import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About QuizOps | QuizOps',
};

export default function AboutPage() {
  return (
    <div className="max-w-[640px] mx-auto px-6" style={{ padding: '48px 24px' }}>
      <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-8">About QuizOps</h1>

      <div className="text-[#3F3F46] leading-relaxed space-y-5 mb-10">
        <p>QuizOps started with a simple frustration.</p>
        <p>
          I publish technical articles on AutoShiftOps — guides on DevOps, cloud
          infrastructure, and AI-powered operations. After writing 66+ articles, I realised
          I had no idea whether readers actually understood what I wrote. Page views told me
          nothing about comprehension.
        </p>
        <p>So I built QuizOps.</p>
        <p>
          Paste your article URL. Get 10 quiz questions in 60 seconds. Share the link with
          your readers. See who understood — and which parts they missed.
        </p>
        <p>
          — Sudhakar Sajja
          <br />
          Application Architect, TechMahindra
          <br />
          Mississauga, Ontario, Canada
        </p>
      </div>

      <div className="border-t border-[#E4E4E7] pt-8 mb-8">
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href="https://autoshiftops.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              autoshiftops.com
            </a>{' '}
            <span className="text-[#71717A]">— personal site + articles</span>
          </li>
          <li>
            <a
              href="https://github.com/AutoShiftOps/quizops"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              github.com/AutoShiftOps/quizops
            </a>{' '}
            <span className="text-[#71717A]">— open source</span>
          </li>
          <li>
            <a href="mailto:admin@autoshiftops.com" className="text-accent hover:underline">
              admin@autoshiftops.com
            </a>{' '}
            <span className="text-[#71717A]">— contact</span>
          </li>
        </ul>
      </div>

      <p className="text-sm text-[#71717A] leading-relaxed">
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
    </div>
  );
}
