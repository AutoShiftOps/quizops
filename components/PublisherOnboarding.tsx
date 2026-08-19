'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { createPublisher } from '@/lib/publisher';

const USERNAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function PublisherOnboarding({ userId }: { userId: string }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function validateFormat(value: string): boolean {
    return value.length >= 3 && value.length <= 20 && USERNAME_PATTERN.test(value);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) {
      setAvailability('idle');
      return;
    }
    if (!validateFormat(username)) {
      setAvailability('invalid');
      return;
    }
    setAvailability('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = await getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const json = await res.json();
        setAvailability(json.available ? 'available' : 'taken');
      } catch {
        setAvailability('idle');
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const canSubmit = availability === 'available' && displayName.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = await getSupabaseClient();
      await createPublisher(supabase, userId, username, displayName.trim(), bio.trim());
      // This is the one reliable "brand-new account" signal — the very
      // first publishers row for this auth_uid (PublisherOnboarding only
      // ever renders when dashboard/page.tsx found none). Send them
      // straight into quiz creation instead of reloading into an empty
      // dashboard shell — regardless of which button (Sign in / Start for
      // free) got them here. Returning users never hit this component at
      // all (they already have a publishers row), so /dashboard stays
      // their normal, un-redirected landing spot.
      window.location.href = '/dashboard/new';
    } catch {
      setError('Could not create your profile. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-semibold mb-2 text-[#F1F5F9]">
        Set up your publisher profile
      </h1>
      <p className="text-[#94A3B8] text-sm mb-8">
        Choose a username — this appears in your quiz URLs:{' '}
        <span className="text-accent">quiz.autoshiftops.com/q/[username]/...</span>
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[#F1F5F9]">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="e.g. sajja"
            maxLength={20}
            className="w-full px-4 py-2 rounded-md bg-[#0F1520] border border-[#1E2D45] focus:border-accent outline-none text-[#F1F5F9]"
          />
          <p className="text-xs mt-1.5">
            {availability === 'checking' && <span className="text-[#475569]">Checking…</span>}
            {availability === 'available' && <span className="text-success">✓ Available</span>}
            {availability === 'taken' && <span className="text-danger">✗ Taken</span>}
            {availability === 'invalid' && (
              <span className="text-danger">
                ✗ Invalid format — 3-20 chars, lowercase letters, numbers, hyphens only, no
                leading/trailing hyphens
              </span>
            )}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[#F1F5F9]">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Sudhakar Sajja"
            maxLength={50}
            className="w-full px-4 py-2 rounded-md bg-[#0F1520] border border-[#1E2D45] focus:border-accent outline-none text-[#F1F5F9]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[#F1F5F9]">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full px-4 py-2 rounded-md bg-[#0F1520] border border-[#1E2D45] focus:border-accent outline-none resize-none text-[#F1F5F9]"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating…' : 'Create profile'}
        </button>
      </div>
    </div>
  );
}
