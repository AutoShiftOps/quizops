'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  border: '1px solid #E4E4E7',
  borderRadius: 8,
  fontSize: 14,
  marginBottom: 4,
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
        className="bg-white w-full"
        style={{
          borderRadius: 16,
          padding: 32,
          maxWidth: 440,
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <div
            className="flex items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', fontSize: 20 }}
          >
            🚀
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover:text-[#18181B] transition-colors"
            style={{ color: '#71717A', fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center pt-2">
            <div style={{ fontSize: 48, color: '#22C55E', marginBottom: 12 }}>✅</div>
            <h3 className="font-heading font-bold text-[#18181B] mb-2" style={{ fontSize: 20 }}>
              You are on the list!
            </h3>
            <p style={{ color: '#71717A', fontSize: 14, lineHeight: 1.6 }} className="mb-3">
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
              className="block w-full text-center bg-accent text-white hover:opacity-90 transition-opacity"
              style={{ padding: 12, borderRadius: 8, fontWeight: 600, fontSize: 15, marginBottom: 12 }}
            >
              Start for free →
            </Link>
            <button
              onClick={onClose}
              className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2
              className="font-heading font-bold text-[#18181B] mt-2 mb-2"
              style={{ fontSize: 22, fontWeight: 700 }}
            >
              Join the Pro waitlist
            </h2>
            <p style={{ color: '#71717A', fontSize: 14 }} className="mb-3">
              Be first to know when Pro launches. Early access pricing for waitlist members.
            </p>

            {!countLoading && count !== null && count > 0 && (
              <p style={{ color: '#3E7BFA', fontSize: 13, fontWeight: 600 }} className="mb-5">
                {count} {count === 1 ? 'publisher' : 'publishers'} already on the waitlist
              </p>
            )}
            {countLoading && (
              <p style={{ color: '#A1A1AA', fontSize: 13 }} className="mb-5">
                Loading waitlist count…
              </p>
            )}

            <label className="block text-sm font-medium text-[#18181B] mb-1.5">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sudhakar Sajja"
              style={{
                ...inputStyle,
                borderColor: fieldErrors.name ? '#EF4444' : '#E4E4E7',
              }}
              className="focus:outline-none focus:border-accent"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3E7BFA';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(62,123,250,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.name ? '#EF4444' : '#E4E4E7';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.name && (
              <p style={{ color: '#EF4444', fontSize: 12 }} className="mb-3 -mt-1">
                {fieldErrors.name}
              </p>
            )}

            <label className="block text-sm font-medium text-[#18181B] mb-1.5 mt-3">Work email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                ...inputStyle,
                borderColor: fieldErrors.email ? '#EF4444' : '#E4E4E7',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3E7BFA';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(62,123,250,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.email ? '#EF4444' : '#E4E4E7';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.email && (
              <p style={{ color: '#EF4444', fontSize: 12 }} className="mb-3 -mt-1">
                {fieldErrors.email}
              </p>
            )}

            <label className="block text-sm font-medium text-[#18181B] mb-1.5 mt-3">
              Your website or blog
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourblog.com"
              style={{
                ...inputStyle,
                borderColor: fieldErrors.websiteUrl ? '#EF4444' : '#E4E4E7',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3E7BFA';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(62,123,250,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.websiteUrl ? '#EF4444' : '#E4E4E7';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.websiteUrl ? (
              <p style={{ color: '#EF4444', fontSize: 12 }} className="mb-3 -mt-1">
                {fieldErrors.websiteUrl}
              </p>
            ) : (
              <p style={{ color: '#A1A1AA', fontSize: 12 }} className="mb-3 -mt-1">
                Where you publish your articles
              </p>
            )}

            {alreadyOnWaitlist && (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: '#92400E',
                }}
                className="mb-4 mt-1"
              >
                You are already on the waitlist!
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-60"
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
