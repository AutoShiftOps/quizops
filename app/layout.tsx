import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import '@/styles/globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

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

// Used by the BentoGrid's mock streaming/analytics previews (M2-03) —
// self-hosted via next/font like the other two, rather than a runtime
// Google Fonts <link>, for the same reason: no extra network round-trip and
// no flash of fallback monospace.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
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

// Single root layout for the whole site (M2-03 full-dark redesign) — the
// (light) and (dark) route groups are gone now that there's only one theme,
// so NavBar renders here directly instead of via two separate group
// layouts.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body min-h-screen flex flex-col" style={{ background: '#080C14', color: '#F1F5F9' }}>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
