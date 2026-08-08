'use client';

import { useState } from 'react';
import Link from 'next/link';

type Billing = 'monthly' | 'annual';

const FAQS = [
  {
    q: 'Can I try before paying?',
    a: 'Yes — the Free tier is permanent and requires no credit card. Pro waitlist is open for early access.',
  },
  {
    q: 'What AI model generates the questions?',
    a: 'Free and Pro use GPT-4o mini (OpenAI). Enterprise tier uses Claude (Anthropic) for higher quality generation.',
  },
  {
    q: 'Is my article content stored?',
    a: 'Article text is sent to OpenAI for generation only and is not stored by QuizOps after the quiz is created.',
  },
  {
    q: 'Do you offer educational discounts?',
    a: 'Yes. Non-profits and educational institutions receive 50% off Pro. Contact admin@autoshiftops.com.',
  },
  {
    q: 'What is the Enterprise SLA?',
    a: '99.9% monthly uptime, measured on our public status page. Downtime credits available per contract.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel Pro anytime from your account settings. Annual plans get pro-rata refund within 14 days.',
  },
];

function Feature({ children, included = true }: { children: React.ReactNode; included?: boolean }) {
  return (
    <li className={`flex items-start gap-2 text-sm ${included ? 'text-[#18181B]' : 'text-[#A1A1AA]'}`}>
      <span className={included ? 'text-success' : 'text-[#D4D4D8]'}>{included ? '✓' : '✗'}</span>
      <span>{children}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E4E4E7] py-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium text-[#18181B]">{q}</span>
        <span className="text-[#71717A] shrink-0 ml-4">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="text-sm text-[#71717A] mt-2 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const isAnnual = billing === 'annual';

  return (
    <div>
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto px-6" style={{ paddingTop: 64 }}>
        <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] mb-5">
          Simple, transparent pricing
        </span>
        <h1
          className="font-heading font-extrabold text-[#18181B] mb-3"
          style={{ fontSize: 36 }}
        >
          Start free. Scale when ready.
        </h1>
        <p className="text-[#71717A] mb-6">
          No credit card required to start. Upgrade when you need more.
        </p>

        <div className="inline-flex items-center bg-[#F4F4F5] rounded-md p-1 mb-4">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billing === 'monthly' ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billing === 'annual' ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A]'
            }`}
          >
            Annual — save 22%
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[960px] mx-auto"
        style={{ padding: '48px 24px' }}
      >
        {/* Free */}
        <div
          className="bg-white border border-[#E4E4E7] flex flex-col"
          style={{ borderRadius: 16, padding: 32 }}
        >
          <p className="text-[13px] font-semibold text-[#71717A] uppercase">Free</p>
          <p className="font-heading font-extrabold text-[#18181B] mt-2" style={{ fontSize: 40 }}>
            $0
          </p>
          <p className="text-sm text-[#71717A] mb-4">forever</p>
          <p className="text-sm text-[#71717A] mb-5">
            Perfect for individual writers testing the waters.
          </p>
          <hr className="border-[#E4E4E7] mb-5" />
          <ul className="space-y-2.5 mb-6 flex-1">
            <Feature>3 published quizzes</Feature>
            <Feature>AI question generation</Feature>
            <Feature>Basic analytics (7 days)</Feature>
            <Feature>Community quiz banks</Feature>
            <Feature included={false}>QuizOps branding on quizzes</Feature>
            <Feature included={false}>Advanced analytics</Feature>
            <Feature included={false}>iFrame embed</Feature>
          </ul>
          <Link
            href="/dashboard"
            className="w-full text-center bg-white text-[#18181B] border border-[#E4E4E7] hover:border-[#D4D4D8] transition-colors font-medium"
            style={{ borderRadius: 8, padding: 12 }}
          >
            Start for free →
          </Link>
        </div>

        {/* Pro */}
        <div
          className="bg-white flex flex-col relative"
          style={{
            border: '2px solid #3E7BFA',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 8px 32px rgba(62,123,250,0.12)',
          }}
        >
          <span
            className="absolute bg-accent text-white font-semibold"
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, top: -12, right: 24 }}
          >
            Most popular
          </span>
          <p className="text-[13px] font-semibold text-accent uppercase">Pro</p>
          <div className="flex items-end gap-1 mt-2">
            <p className="font-heading font-extrabold text-[#18181B]" style={{ fontSize: 40 }}>
              {isAnnual ? '$7' : '$9'}
            </p>
            <p className="text-sm text-[#71717A] mb-2">/month</p>
          </div>
          {isAnnual ? (
            <p className="text-xs text-[#71717A] mb-4">Billed $84/year (save $24)</p>
          ) : (
            <p className="text-sm text-[#71717A] mb-4">&nbsp;</p>
          )}
          <p className="text-sm text-[#71717A] mb-5">
            For serious publishers who want full control and insights.
          </p>
          <hr className="border-[#E4E4E7] mb-5" />
          <ul className="space-y-2.5 mb-6 flex-1">
            <Feature>Unlimited quizzes</Feature>
            <Feature>AI question generation</Feature>
            <Feature>Full analytics history</Feature>
            <Feature>Remove QuizOps branding</Feature>
            <Feature>iFrame embed support</Feature>
            <Feature>Priority support</Feature>
            <Feature>Community quiz banks</Feature>
            <Feature>All Free features</Feature>
          </ul>
          <Link
            href="/waitlist"
            className="w-full text-center bg-accent text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ borderRadius: 8, padding: 12 }}
          >
            Join Pro waitlist →
          </Link>
        </div>

        {/* Enterprise */}
        <div
          className="border border-[#E4E4E7] flex flex-col"
          style={{ borderRadius: 16, padding: 32, background: '#FAFAFA' }}
        >
          <p className="text-[13px] font-semibold text-[#71717A] uppercase">Enterprise</p>
          <p className="font-heading font-extrabold text-[#18181B] mt-2" style={{ fontSize: 32 }}>
            Custom
          </p>
          <p className="text-sm text-[#71717A] mb-4">pricing</p>
          <p className="text-sm text-[#71717A] mb-5">
            For teams, platforms, and publications that need more.
          </p>
          <hr className="border-[#E4E4E7] mb-5" />
          <ul className="space-y-2.5 mb-6 flex-1">
            <Feature>Everything in Pro</Feature>
            <Feature>Team seats (unlimited authors)</Feature>
            <Feature>Custom domain (quiz.yourcompany.com)</Feature>
            <Feature>White-label branding</Feature>
            <Feature>SSO (Okta, Azure AD, Google Workspace)</Feature>
            <Feature>Analytics export (CSV + API)</Feature>
            <Feature>SLA: 99.9% uptime guarantee</Feature>
            <Feature>Dedicated onboarding</Feature>
            <Feature>Annual invoicing / PO accepted</Feature>
            <Feature>Priority feature requests</Feature>
            <Feature>Claude AI generation (higher quality)</Feature>
          </ul>
          <a
            href="mailto:admin@autoshiftops.com?subject=QuizOps Enterprise Enquiry"
            className="w-full text-center bg-[#18181B] text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ borderRadius: 8, padding: 12 }}
          >
            Contact us →
          </a>
        </div>
      </div>

      <p className="text-center text-[13px] text-[#71717A] -mt-4 mb-8">
        🔒 All plans include SSL, GDPR compliance, and data stored securely in Canada/US.
      </p>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6" style={{ marginTop: 64, marginBottom: 32 }}>
        <h2 className="font-heading font-bold text-[#18181B] text-center mb-8" style={{ fontSize: 24 }}>
          Frequently asked questions
        </h2>
        <div>
          {FAQS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center" style={{ background: '#F4F4F5', padding: '64px 24px' }}>
        <h2 className="font-heading font-bold text-[#18181B] mb-3" style={{ fontSize: 28 }}>
          Ready to know if your readers actually understand your writing?
        </h2>
        <p className="text-[#71717A] mb-6 max-w-xl mx-auto">
          Join technical writers using QuizOps to add comprehension to their content.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            Start for free →
          </Link>
          <a
            href="mailto:admin@autoshiftops.com"
            className="px-5 py-2.5 rounded-md border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] transition-colors"
          >
            Talk to us
          </a>
        </div>
      </div>
    </div>
  );
}
