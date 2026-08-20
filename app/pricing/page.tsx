'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { getPublisher } from '@/lib/publisher';
import { Publisher } from '@/lib/types';
import { track } from '@/lib/analytics';
import { startProCheckout } from '@/lib/stripeCheckout';

type Billing = 'monthly' | 'annual';

async function authHeader(): Promise<Record<string, string>> {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ''}` };
}

const FAQS = [
  {
    q: 'Can I try before paying?',
    a: 'Yes — the Free tier is permanent and requires no credit card. Upgrade to Pro anytime, cancel anytime.',
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
    <li className="flex items-start gap-2 text-sm" style={{ color: included ? '#F1F5F9' : '#475569' }}>
      <span style={{ color: included ? '#22C55E' : '#253447' }}>{included ? '✓' : '✗'}</span>
      <span>{children}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #1E2D45', padding: '16px 0' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium" style={{ color: '#F1F5F9' }}>
          {q}
        </span>
        <span className="shrink-0 ml-4" style={{ color: '#94A3B8' }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <p className="text-sm mt-2 leading-relaxed" style={{ color: '#94A3B8' }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<Billing>('monthly');
  const isAnnual = billing === 'annual';
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // Bug fix — null while unknown/signed-out, so the default "Upgrade to
  // Pro" CTA renders until we know otherwise; a signed-in Pro/Team
  // publisher gets "Manage subscription" instead, so clicking "Upgrade"
  // while already Pro (which produced the raw "already_pro" string) is no
  // longer reachable in the first place.
  const [publisherTier, setPublisherTier] = useState<Publisher['tier'] | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    track('pricing_page_viewed');
  }, []);

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then((res) => res.json())
      .then((data) => setWaitlistCount(typeof data.count === 'number' ? data.count : null))
      .catch(() => setWaitlistCount(null));
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      const publisher = await getPublisher(supabase, session.user.id);
      if (!publisher) {
        // Signed in but no publishers row yet — mid-onboarding, or landed
        // here before ever completing it. /dashboard is the onboarding
        // gate (PublisherOnboarding renders there when this lookup comes
        // back empty) — send them there instead of letting this page go on
        // to show a "Could not find your publisher profile" error the
        // moment they'd click Upgrade.
        router.replace('/dashboard');
        return;
      }
      setPublisherTier(publisher.tier);
    })().catch(() => {});
  }, []);

  const isPro = publisherTier === 'pro' || publisherTier === 'team';

  async function handleUpgrade() {
    setCheckingOut(true);
    setCheckoutError(null);
    const { url, error } = await startProCheckout();
    if (url) {
      window.location.href = url;
      return;
    }
    setCheckoutError(error || 'Something went wrong');
    setCheckingOut(false);
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    const headers = await authHeader();
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.error('[pricing] manage subscription failed:', err);
    }
    setPortalLoading(false);
  }

  return (
    <div style={{ background: '#080C14' }}>
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto px-6" style={{ paddingTop: 64 }}>
        <span
          className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-5"
          style={{ background: 'rgba(62,123,250,0.08)', border: '1px solid rgba(62,123,250,0.3)', color: '#94A3B8' }}
        >
          Simple, transparent pricing
        </span>
        <h1 className="font-heading font-extrabold mb-3" style={{ fontSize: 36, color: '#F1F5F9' }}>
          Start free. Scale when ready.
        </h1>
        <p className="mb-6" style={{ color: '#94A3B8' }}>
          No credit card required to start. Upgrade when you need more.
        </p>

        <div
          className="inline-flex items-center rounded-md p-1 mb-4"
          style={{ background: '#161D2E' }}
        >
          <button
            onClick={() => setBilling('monthly')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              billing === 'monthly'
                ? { background: '#0F1520', color: '#F1F5F9' }
                : { color: '#94A3B8' }
            }
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              billing === 'annual'
                ? { background: '#0F1520', color: '#F1F5F9' }
                : { color: '#94A3B8' }
            }
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
          className="flex flex-col"
          style={{ background: '#0F1520', border: '1px solid #1E2D45', borderRadius: 16, padding: 32 }}
        >
          <p className="text-[13px] font-semibold uppercase" style={{ color: '#94A3B8' }}>
            Free
          </p>
          <p className="font-heading font-extrabold mt-2" style={{ fontSize: 40, color: '#F1F5F9' }}>
            $0
          </p>
          <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
            forever
          </p>
          <p className="text-sm mb-5" style={{ color: '#94A3B8' }}>
            Perfect for individual writers testing the waters.
          </p>
          <hr className="mb-5" style={{ borderColor: '#1E2D45' }} />
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
            className="w-full text-center font-medium transition-colors"
            style={{
              borderRadius: 8,
              padding: 12,
              background: 'transparent',
              border: '1px solid #1E2D45',
              color: '#F1F5F9',
            }}
          >
            Start for free →
          </Link>
        </div>

        {/* Pro */}
        <div
          className="flex flex-col relative"
          style={{
            background: 'linear-gradient(135deg, #0F1520, #0D1829)',
            border: '1px solid #3E7BFA',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 0 40px rgba(62,123,250,0.1)',
          }}
        >
          <span
            className="btn-glow absolute font-semibold"
            style={{
              fontSize: 11,
              padding: '4px 12px',
              borderRadius: 20,
              top: -12,
              right: 24,
              background: '#3E7BFA',
              color: '#fff',
            }}
          >
            Most popular
          </span>
          <p className="text-[13px] font-semibold uppercase" style={{ color: '#3E7BFA' }}>
            Pro
          </p>
          <div className="flex items-end gap-1 mt-2">
            <p className="font-heading font-extrabold" style={{ fontSize: 40, color: '#F1F5F9' }}>
              {isAnnual ? '$7' : '$9'}
            </p>
            <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>
              /month
            </p>
          </div>
          {isAnnual ? (
            <p className="text-xs mb-4" style={{ color: '#94A3B8' }}>
              Billed $84/year (save $24)
            </p>
          ) : (
            <p className="text-sm mb-4">&nbsp;</p>
          )}
          <p className="text-sm mb-5" style={{ color: '#94A3B8' }}>
            For serious publishers who want full control and insights.
          </p>
          <hr className="mb-5" style={{ borderColor: '#1E2D45' }} />
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
          {isPro ? (
            <>
              <div
                className="w-full text-center font-semibold"
                style={{
                  borderRadius: 8,
                  padding: 12,
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  color: '#22C55E',
                }}
              >
                You&apos;re on Pro ✓
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="text-center mt-2 hover:underline transition-colors disabled:opacity-60"
                style={{ color: '#94A3B8', fontSize: 13, width: '100%' }}
              >
                {portalLoading ? 'Opening…' : 'Manage subscription →'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleUpgrade}
                disabled={checkingOut}
                className="btn-glow w-full text-center font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ borderRadius: 8, padding: 12, background: '#3E7BFA', color: '#fff' }}
              >
                {checkingOut ? 'Redirecting…' : 'Upgrade to Pro →'}
              </button>
              {checkoutError && (
                <p className="text-center mt-2" style={{ color: '#EF4444', fontSize: 12 }}>
                  {checkoutError}
                </p>
              )}
            </>
          )}
          {waitlistCount !== null && waitlistCount > 0 && (
            <p className="text-center mt-2" style={{ color: '#475569', fontSize: 12 }}>
              {waitlistCount} {waitlistCount === 1 ? 'publisher' : 'publishers'} joined via the
              waitlist
            </p>
          )}
        </div>

        {/* Enterprise */}
        <div
          className="flex flex-col"
          style={{ border: '1px solid #1E2D45', borderRadius: 16, padding: 32, background: '#0D1420' }}
        >
          <p className="text-[13px] font-semibold uppercase" style={{ color: '#94A3B8' }}>
            Enterprise
          </p>
          <p className="font-heading font-extrabold mt-2" style={{ fontSize: 32, color: '#F1F5F9' }}>
            Custom
          </p>
          <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
            pricing
          </p>
          <p className="text-sm mb-5" style={{ color: '#94A3B8' }}>
            For teams, platforms, and publications that need more.
          </p>
          <hr className="mb-5" style={{ borderColor: '#1E2D45' }} />
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
            onClick={() => track('enterprise_contact_clicked')}
            className="w-full text-center font-semibold hover:opacity-90 transition-opacity"
            style={{ borderRadius: 8, padding: 12, background: '#F1F5F9', color: '#080C14' }}
          >
            Contact us →
          </a>
        </div>
      </div>

      <p className="text-center text-[13px] -mt-4 mb-8" style={{ color: '#94A3B8' }}>
        🔒 Your data stays yours — encrypted in transit, Row-Level Security enforced, hosted on Supabase and Vercel.
      </p>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6" style={{ marginTop: 64, marginBottom: 32 }}>
        <h2 className="font-heading font-bold text-center mb-8" style={{ fontSize: 24, color: '#F1F5F9' }}>
          Frequently asked questions
        </h2>
        <div>
          {FAQS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="text-center relative overflow-hidden"
        style={{ background: '#0D1420', padding: '64px 24px' }}
      >
        <h2 className="font-heading font-bold mb-3" style={{ fontSize: 28, color: '#F1F5F9' }}>
          Ready to know if your readers actually understand your writing?
        </h2>
        <p className="mb-6 max-w-xl mx-auto" style={{ color: '#94A3B8' }}>
          Join technical writers using QuizOps to add comprehension to their content.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="btn-glow px-5 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: '#3E7BFA', color: '#fff' }}
          >
            Start for free →
          </Link>
          <a
            href="mailto:admin@autoshiftops.com"
            className="px-5 py-2.5 rounded-md transition-colors"
            style={{ border: '1px solid #1E2D45', color: '#F1F5F9' }}
          >
            Talk to us
          </a>
        </div>
      </div>
    </div>
  );
}
