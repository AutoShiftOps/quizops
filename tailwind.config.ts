import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0E14',
        surface: '#111827',
        border: '#1F2937',
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
        // Enterprise Light theme (M1-01) — used by marketing + dashboard
        // pages. Quiz/exam/reader pages intentionally keep the dark tokens
        // above; this is a second, parallel palette, not a replacement.
        light: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          surface2: '#F4F4F5',
          border: '#E4E4E7',
          border2: '#D4D4D8',
          text: '#18181B',
          text2: '#71717A',
          text3: '#A1A1AA',
        },
      },
      fontFamily: {
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
