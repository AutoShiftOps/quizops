import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy dark tokens (pre-dates the M2-03 full-dark redesign) — kept
        // so the quiz/exam/reader engine components (ExamEngine, QuizEngine,
        // PublishedQuizEngine, etc.) don't need touching; their values are
        // retuned to match the new deeper palette below so those pages
        // inherit the new look with zero code changes.
        background: '#080C14',
        surface: '#0F1520',
        border: '#1E2D45',
        green: '#3ECF8E',
        accent: {
          DEFAULT: '#3E7BFA',
          light: 'rgba(62,123,250,0.12)',
          border: 'rgba(62,123,250,0.25)',
          muted: '#6B8FFD',
        },
        success: {
          DEFAULT: '#22C55E',
          light: 'rgba(34,197,94,0.12)',
          border: 'rgba(34,197,94,0.25)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: 'rgba(245,158,11,0.12)',
          border: 'rgba(245,158,11,0.25)',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: 'rgba(239,68,68,0.1)',
          border: 'rgba(239,68,68,0.2)',
        },
        // Full-dark redesign (M2-03) — Linear/Vercel/BetterStack aesthetic.
        // Everything site-wide now uses these; the light.* token group from
        // the M1-01 enterprise-light era has been removed along with the
        // (light) route group it belonged to.
        dark: {
          bg: '#080C14',
          surface: '#0F1520',
          surface2: '#161D2E',
          border: '#1E2D45',
          border2: '#253447',
        },
        brand: {
          blue: '#3E7BFA',
          'blue-glow': 'rgba(62,123,250,0.15)',
          'blue-subtle': 'rgba(62,123,250,0.08)',
          green: '#22C55E',
          'green-glow': 'rgba(34,197,94,0.15)',
        },
        content: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#475569',
        },
      },
      fontFamily: {
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // pulse-glow (hero blob) and pulse (eyebrow dot) live in
        // globals.css as plain CSS instead of here — they're consumed by
        // .hero-glow/.pulse-dot utility classes, not Tailwind's own
        // animation-* utilities, so defining them a second time here would
        // just be dead weight.
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
