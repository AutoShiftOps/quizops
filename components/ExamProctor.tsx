'use client';

import { useEffect, useState } from 'react';

type Props = {
  violationCount: number;
  onViolation: () => void;
  onAutoSubmit: () => void;
  onPauseChange: (paused: boolean) => void;
};

export default function ExamProctor({
  violationCount,
  onViolation,
  onAutoSubmit,
  onPauseChange,
}: Props) {
  const [paused, setPaused] = useState(false);
  const [fullscreenDenied, setFullscreenDenied] = useState(false);

  useEffect(() => {
    try {
      const result = document.documentElement.requestFullscreen?.();
      result?.catch(() => setFullscreenDenied(true));
      if (!result) setFullscreenDenied(true);
    } catch {
      setFullscreenDenied(true);
    }
  }, []);

  useEffect(() => {
    function registerViolation() {
      if (paused) return;
      const nextCount = violationCount + 1;
      onViolation();
      if (nextCount >= 3) {
        onAutoSubmit();
      } else {
        setPaused(true);
        onPauseChange(true);
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) registerViolation();
    }

    function handleVisibilityChange() {
      if (document.hidden) registerViolation();
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [paused, violationCount, onViolation, onAutoSubmit, onPauseChange]);

  function handleReturn() {
    try {
      document.documentElement.requestFullscreen?.()?.catch(() => {});
    } catch {
      // Ignore — re-entering fullscreen is best-effort.
    }
    setPaused(false);
    onPauseChange(false);
  }

  return (
    <>
      {fullscreenDenied && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Fullscreen wasn&apos;t enabled — you can still take the exam, but focus
          violations are still tracked.
        </div>
      )}

      {paused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
            <h3 className="font-heading text-lg font-semibold mb-2">
              You left the exam window
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Warning {violationCount} of 3 — one more and your exam will be
              auto-submitted.
            </p>
            <button
              onClick={handleReturn}
              className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
            >
              Return to Exam
            </button>
          </div>
        </div>
      )}
    </>
  );
}
