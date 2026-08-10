// New "How it works" section (enterprise homepage redesign). id="how-it-works"
// is the target of the nav's "Features" anchor link, so this renders on the
// homepage unconditionally (both signed-in and guest) — a nav link that
// sometimes scrolls to nothing would be worse than showing marketing copy to
// a logged-in user.

const STEPS = [
  {
    number: '1',
    title: 'Paste your article URL',
    desc:
      'Drop in any article URL from your blog, Medium, dev.to, or Substack. We fetch and analyse the content automatically.',
  },
  {
    number: '2',
    title: 'AI generates questions',
    desc:
      'GPT-4o reads your article and writes 10 multiple-choice questions. Watch them appear in real time. Edit anything you want.',
  },
  {
    number: '3',
    title: 'Share with readers',
    desc:
      'Get a shareable link and embed code. Add it to your article. See who passed, who failed, and which questions tripped people up.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-6 md:px-10 scroll-mt-20"
      style={{ paddingTop: 40, paddingBottom: 40, borderBottom: '1px solid #E4E4E7' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span
            className="inline-block font-semibold uppercase text-[#71717A] mb-3"
            style={{ fontSize: 11, letterSpacing: 1 }}
          >
            How it works
          </span>
          <h2
            className="font-heading font-extrabold text-[#18181B] mb-2"
            style={{ fontSize: 32, letterSpacing: '-0.6px' }}
          >
            From article to quiz in 3 steps
          </h2>
          <p style={{ color: '#71717A', fontSize: 16 }}>No design skills, no coding, no friction.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="relative"
              style={{ background: '#F8FAFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: 16 }}
            >
              <span
                className="flex items-center justify-center rounded-md bg-accent text-white font-bold mb-4"
                style={{ width: 32, height: 32, fontSize: 14 }}
              >
                {step.number}
              </span>
              <h3 className="font-heading font-semibold text-[#18181B] mb-2" style={{ fontSize: 17 }}>
                {step.title}
              </h3>
              <p style={{ color: '#71717A', fontSize: 14, lineHeight: 1.5 }}>{step.desc}</p>

              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden md:block absolute"
                  style={{ right: -13, top: 40, width: 24, height: 2, background: '#BFDBFE' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
