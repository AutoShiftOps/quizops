import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import '@/styles/globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QuizOps — Test your technical knowledge',
  description:
    'Open-source, content-agnostic quiz engine for technical certifications and content-linked knowledge checks.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'QuizOps — Test your technical knowledge',
    description:
      'Open-source quiz engine for DevOps, Cloud, and engineering certifications.',
    url: 'https://quiz.autoshiftops.com',
    siteName: 'QuizOps',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QuizOps — Test your technical knowledge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

// NavBar is no longer rendered here (M1-01) — marketing/dashboard pages use
// LightNavBar and quiz/exam/reader/edit pages use DarkNavBar, each wired up
// by their own route-group layout ((light)/layout.tsx, (dark)/layout.tsx),
// since the two need different backgrounds and Next.js only allows one
// <body> for the whole app. This root layout stays theme-agnostic; the
// light background below is the default for everything that doesn't
// override it via the dark route group.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-light-bg text-light-text font-body min-h-screen">{children}</body>
    </html>
  );
}
