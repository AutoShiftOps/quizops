'use client';

import { useEffect, useState } from 'react';

// Replaces the old 3-step "How it works" cards (M2-03) — a bento grid that
// SHOWS the product instead of describing it in prose. id="how-it-works"
// is still the target of the nav's "Features" anchor link.

const STREAM_LINES = [
  'Q1: What is the primary goal of CI?',
  'Q2: Which strategy reduces deployment risk?',
  'Q3: What does "shift-left" mean in DevOps?',
  'Q4: Name a key benefit of trunk-based dev.',
  'Q5: What triggers a CI pipeline run?',
];

const STREAM_LINE_INTERVAL_MS = 1200;
const STREAM_RESTART_PAUSE_MS = 2000;
const STREAM_WINDOW_SIZE = 3;

const PLATFORM_PILLS = ['Medium', 'dev.to', 'Substack', 'Hashnode', 'Your blog URL'];

const INSIGHT_ROWS = [
  { label: 'Q1: What is CI?', pct: 92 },
  { label: 'Q3: Shift-left meaning', pct: 58 },
  { label: 'Q7: Blue-green deploy', pct: 34 },
];

// Sliding window of 3 lines: starts with lines[0], adds one new line every
// 1200ms (pushing the oldest out once 3 are showing), then pauses 2s once
// all lines have appeared before restarting from the top. The terminal box
// this renders into has a fixed height + overflow: hidden (see the style on
// its container below), so the window cycling never resizes the card —
// only its contents change.
function StreamingText() {
  const [visible, setVisible] = useState<string[]>([STREAM_LINES[0]]);

  useEffect(() => {
    let nextIndex = 1;
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      if (nextIndex < STREAM_LINES.length) {
        const line = STREAM_LINES[nextIndex];
        setVisible((prev) => {
          const next = [...prev, line];
          return next.length > STREAM_WINDOW_SIZE ? next.slice(next.length - STREAM_WINDOW_SIZE) : next;
        });
        nextIndex += 1;
        timer = setTimeout(tick, STREAM_LINE_INTERVAL_MS);
      } else {
        timer = setTimeout(() => {
          nextIndex = 1;
          setVisible([STREAM_LINES[0]]);
          timer = setTimeout(tick, STREAM_LINE_INTERVAL_MS);
        }, STREAM_RESTART_PAUSE_MS);
      }
    }

    timer = setTimeout(tick, STREAM_LINE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {visible.map((line, i) => (
        <p key={line} className="stream-line" style={{ margin: 0, minHeight: 20 }}>
          {line}
          {i === visible.length - 1 && (
            <span className="stream-cursor" aria-hidden="true">
              |
            </span>
          )}
        </p>
      ))}
    </>
  );
}

export default function BentoGrid() {
  return (
    <section
      id="how-it-works"
      className="px-6 md:px-10 scroll-mt-20"
      style={{ paddingTop: 40, paddingBottom: 64, background: '#080C14' }}
    >
      <div className="mx-auto" style={{ maxWidth: 1080 }}>
        <div className="text-center mb-8">
          <span
            className="inline-block font-semibold uppercase mb-3"
            style={{ fontSize: 11, letterSpacing: 1, color: '#94A3B8' }}
          >
            How it works
          </span>
          <h2
            className="font-heading font-extrabold mb-2"
            style={{ fontSize: 32, letterSpacing: '-0.6px', color: '#F1F5F9' }}
          >
            From article to quiz — see it happen
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 16 }}>No design skills, no coding, no friction.</p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mx-auto"
          style={{ maxWidth: 960, marginTop: 32 }}
        >
          {/* Card A — AI generation, col-span 2 */}
          <div
            className="md:col-span-2"
            style={{ background: '#0F1520', border: '1px solid #1E2D45', borderRadius: 16, padding: 28 }}
          >
            <p
              className="font-semibold uppercase mb-2"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: '#3E7BFA' }}
            >
              AI generation
            </p>
            <h3 className="font-heading font-bold mb-2" style={{ fontSize: 22, color: '#F1F5F9' }}>
              Questions in 60 seconds
            </h3>
            <p className="mb-4" style={{ color: '#94A3B8', fontSize: 14 }}>
              Watch questions stream in as AI reads your article.
            </p>
            <div
              style={{
                background: '#080C14',
                borderRadius: 8,
                padding: '16px',
                marginTop: 16,
                height: 140, // fixed — fits 3 lines; card must not resize as lines cycle
                overflow: 'hidden',
                position: 'relative',
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 13,
                lineHeight: 1.8,
                color: '#22C55E',
              }}
            >
              <StreamingText />
            </div>
          </div>

          {/* Card B — Stats, col-span 1 */}
          <div
            className="flex flex-col justify-center gap-6"
            style={{
              background: 'linear-gradient(135deg, #0F1520 0%, #0D1829 100%)',
              border: '1px solid rgba(62,123,250,0.2)',
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div>
              <p style={{ fontSize: 48, fontWeight: 800, color: '#3E7BFA', lineHeight: 1 }}>60s</p>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Generation time</p>
            </div>
            <div>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#22C55E', lineHeight: 1 }}>100%</p>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Free to start</p>
            </div>
          </div>

          {/* Card C — Works anywhere, col-span 1 */}
          <div style={{ background: '#0F1520', border: '1px solid #1E2D45', borderRadius: 16, padding: 28 }}>
            <p
              className="font-semibold uppercase mb-3"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: '#3E7BFA' }}
            >
              Works with any platform
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_PILLS.map((pill) => (
                <span
                  key={pill}
                  style={{
                    background: '#161D2E',
                    border: '1px solid #1E2D45',
                    color: '#94A3B8',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 8, textAlign: 'center' }}>
              Works best with text-based articles. YouTube, paywalled, and login-required pages
              are not supported.
            </p>
          </div>

          {/* Card D — Reader insight, col-span 2 */}
          <div
            className="md:col-span-2"
            style={{ background: '#0F1520', border: '1px solid #1E2D45', borderRadius: 16, padding: 28 }}
          >
            <p
              className="font-semibold uppercase mb-2"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: '#3E7BFA' }}
            >
              Reader analytics
            </p>
            <h3 className="font-heading font-bold mb-4" style={{ fontSize: 22, color: '#F1F5F9' }}>
              See who understood — and who didn&apos;t
            </h3>
            <div className="space-y-2">
              {INSIGHT_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3"
                  style={{ fontSize: 12, fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', color: '#94A3B8' }}
                >
                  <span className="shrink-0" style={{ minWidth: 180 }}>
                    {row.label}
                  </span>
                  <span
                    className="flex-1 flex items-center rounded-full overflow-hidden"
                    style={{ background: '#161D2E', height: 8 }}
                  >
                    <span
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, background: '#3E7BFA' }}
                    />
                  </span>
                  <span className="shrink-0" style={{ width: 36, textAlign: 'right' }}>
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
