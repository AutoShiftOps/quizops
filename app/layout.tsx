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
