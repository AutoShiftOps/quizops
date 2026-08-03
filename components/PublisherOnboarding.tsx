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
      window.location.reload();
    } catch {
      setError('Could not create your profile. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-semibold mb-2">
        Set up your publisher profile
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Choose a username — this appears in your quiz URLs:{' '}
        <span className="text-accent">quiz.autoshiftops.com/q/[username]/...</span>
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="e.g. sajja"
            maxLength={20}
            className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
          />
          <p className="text-xs mt-1.5">
            {availability === 'checking' && <span className="text-gray-500">Checking…</span>}
            {availability === 'available' && <span className="text-green">✓ Available</span>}
            {availability === 'taken' && <span className="text-red-400">✗ Taken</span>}
            {availability === 'invalid' && (
              <span className="text-red-400">
                ✗ Invalid format — 3-20 chars, lowercase letters, numbers, hyphens only, no
                leading/trailing hyphens
              </span>
            )}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Sudhakar Sajja"
            maxLength={50}
            className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-accent outline-none resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

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
