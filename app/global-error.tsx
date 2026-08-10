'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h2 style={{ color: '#18181B', fontSize: '20px' }}>Something went wrong</h2>
        <p style={{ color: '#71717A', fontSize: '14px' }}>
          We&apos;ve been notified and are looking into it.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            background: '#3E7BFA',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Try again
        </button>
        <a href="/" style={{ color: '#3E7BFA', fontSize: '13px' }}>
          ← Back to homepage
        </a>
      </body>
    </html>
  );
}
