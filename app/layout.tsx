import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import NavBar from '@/components/NavBar';
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
    // TODO: replace og-image.png with branded version
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-background text-white font-body min-h-screen">
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
