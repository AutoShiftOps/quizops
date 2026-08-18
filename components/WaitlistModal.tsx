'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { startProCheckout } from '@/lib/stripeCheckout';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type FieldErrors = {
  name?: string;
  email?: string;
  websiteUrl?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #1E2D45',
  borderRadius: 8,
  fontSize: 14,
  marginBottom: 4,
  background: '#080C14',
  color: '#F1F5F9',
};

function validate(name: string, email: string, websiteUrl: string): FieldErrors {
  const errors: FieldErrors = {};
  if (name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (websiteUrl.trim() && !/^https?:\/\//i.test(websiteUrl.trim())) {
    errors.websiteUrl = 'Must start with http:// or https://';
  }
  return errors;
}

export default function WaitlistModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [alreadyOnWaitlist, setAlreadyOnWaitlist] = useState(false);
  const [success, setSuccess] = useState<{ count: number | null } | null>(null);

  const [count, setCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);

  // M2-01 — real billing now exists, so every "Upgrade to Pro" trigger
  // site-wide that still opens this modal (dashboard upsells, share/embed
  // locks, analytics free-tier notice) gets a real checkout path here
  // rather than needing to be individually rewired to /api/stripe/checkout.
  // The waitlist form below stays as a fallback for visitors who aren't
  // ready to pay yet.
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    // Reset to a clean form each time the modal opens, in case it was
    // previously submitted/closed and reopened.
    setName('');
    setEmail('');
    setWebsiteUrl('');
    setFieldErrors({});
    setNetworkError(null);
    setAlreadyOnWaitlist(false);
    setSuccess(null);

    setCountLoading(true);
    fetch('/api/waitlist/count')
      .then((res) => res.json())
      .then((data) => setCount(typeof data.count === 'number' ? data.count : 0))
      .catch(() => setCount(null))
      .finally(() => setCountLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit() {
    const errors = validate(name, email, websiteUrl);
    setFieldErrors(errors);
    setNetworkError(null);
    setAlreadyOnWaitlist(false);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), websiteUrl: websiteUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess({ count: typeof data.count === 'number' ? data.count : null });
      } else if (data.error === 'already_on_waitlist') {
        setAlreadyOnWaitlist(true);
      } else if (data.error === 'invalid_name' || data.error === 'invalid_email' || data.error === 'invalid_url') {
        const field = data.error === 'invalid_name' ? 'name' : data.error === 'invalid_email' ? 'email' : 'websiteUrl';
        setFieldErrors({ [field]: data.message });
      } else {
        setNetworkError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setNetworkError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full"
        style={{
          background: '#0F1520',
          border: '1px solid #1E2D45',
          borderRadius: 16,
          padding: 32,
          maxWidth: 440,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <div
            className="flex items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(62,123,250,0.12)', fontSize: 20 }}
          >
            🚀
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover:text-content-primary transition-colors"
            style={{ color: '#94A3B8', fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center pt-2">
            <div style={{ fontSize: 48, color: '#22C55E', marginBottom: 12 }}>✅</div>
            <h3 className="font-heading font-bold mb-2" style={{ fontSize: 20, color: '#F1F5F9' }}>
              You are on the list!
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6 }} className="mb-3">
              We will email you at {email} when Pro launches. Check your inbox for a
              confirmation.
            </p>
            {success.count !== null && (
              <p style={{ color: '#3E7BFA', fontWeight: 600, fontSize: 14 }} className="mb-6">
                You are #{success.count} on the waitlist
              </p>
            )}
            <Link
              href="/dashboard"
              className="btn-glow block w-full text-center bg-brand-blue text-white hover:opacity-90 transition-opacity"
              style={{ padding: 12, borderRadius: 8, fontWeight: 600, fontSize: 15, marginBottom: 12 }}
            >
              Start for free →
            </Link>
            <button
              onClick={onClose}
              className="text-sm hover:text-content-primary transition-colors"
              style={{ color: '#94A3B8' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2
              className="font-heading font-bold mt-2 mb-2"
              style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}
            >
              Upgrade to Pro
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 14 }} className="mb-4">
              $9/month. Unlimited quizzes, full analytics history, iFrame embed, no QuizOps
              branding.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={checkingOut}
              className="btn-glow w-full bg-brand-blue text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ padding: 12, borderRadius: 8, fontSize: 15, fontWeight: 600, marginBottom: 8 }}
            >
              {checkingOut ? 'Redirecting to checkout…' : 'Upgrade to Pro →'}
            </button>
            {checkoutError && (
              <p style={{ color: '#EF4444', fontSize: 13 }} className="mb-2 text-center">
                {checkoutError}
              </p>
            )}

            <div className="flex items-center gap-3 my-5">
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1E2D45' }} />
              <span style={{ color: '#475569', fontSize: 12 }}>or</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1E2D45' }} />
            </div>

            <h2
              className="font-heading font-bold mb-2"
              style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}
            >
              Not ready yet? Join the waitlist
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 14 }} className="mb-3">
              Get notified about new features and early access pricing.
            </p>

            {!countLoading && count !== null && count > 0 && (
              <p style={{ color: '#3E7BFA', fontSize: 13, fontWeight: 600 }} className="mb-5">
                {count} {count === 1 ? 'publisher' : 'publishers'} already on the waitlist
              </p>
            )}
            {countLoading && (
              <p style={{ color: '#475569', fontSize: 13 }} className="mb-5">
                Loading waitlist count…
              </p>
            )}

            <label className="block text-sm font-medium mb-1.5" style={{ color: '#F1F5F9' }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sudhakar Sajja"
              style={{
                ...inputStyle,
                borderColor: fieldErrors.name ? '#EF4444' : '#1E2D45',
              }}
              className="focus:outline-none"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3E7BFA';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(62,123,250,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.name ? '#EF4444' : '#1E2D45';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.name && (
              <p style={{ color: '#EF4444', fontSize: 12 }} className="mb-3 -mt-1">
                {fieldErrors.name}
              </p>
            )}

            <label className="block text-sm font-medium mb-1.5 mt-3" style={{ color: '#F1F5F9' }}>
              Work email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                ...inputStyle,
                borderColor: fieldErrors.email ? '#EF4444' : '#1E2D45',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3E7BFA';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(62,123,250,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.email ? '#EF4444' : '#1E2D45';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.email && (
              <p style={{ color: '#EF4444', fontSize: 12 }} className="mb-3 -mt-1">
                {fieldErrors.email}
              </p>
            )}

            <label className="block text-sm font-medium mb-1.5 mt-3" style={{ color: '#F1F5F9' }}>
              Your website or blog
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourblog.com"
              style={{
                ...inputStyle,
                borderColor: fieldErrors.websiteUrl ? '#EF4444' : '#1E2D45',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3E7BFA';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(62,123,250,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.websiteUrl ? '#EF4444' : '#1E2D45';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.websiteUrl ? (
              <p style={{ color: '#EF4444', fontSize: 12 }} className="mb-3 -mt-1">
                {fieldErrors.websiteUrl}
              </p>
            ) : (
              <p style={{ color: '#475569', fontSize: 12 }} className="mb-3 -mt-1">
                Where you publish your articles
              </p>
            )}

            {alreadyOnWaitlist && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: '#FBBF24',
                }}
                className="mb-4 mt-1"
              >
                You are already on the waitlist!
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-glow w-full bg-brand-blue text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ padding: 12, borderRadius: 8, fontSize: 15, fontWeight: 600, marginTop: 4 }}
            >
              {loading ? 'Joining...' : 'Join the waitlist →'}
            </button>

            {networkError && (
              <p style={{ color: '#EF4444', fontSize: 13 }} className="mt-2 text-center">
                {networkError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
