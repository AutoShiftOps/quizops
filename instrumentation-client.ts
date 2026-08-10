import * as Sentry from '@sentry/nextjs';

// Client-side uses NEXT_PUBLIC_SENTRY_DSN (not SENTRY_DSN) so it's actually
// present in the browser bundle — server-only env vars never reach client
// code in Next.js, regardless of where Sentry.init() is called from.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  enabled: process.env.NODE_ENV === 'production',
});

// Not in the original spec, but the SDK flags this as "ACTION REQUIRED" the
// moment instrumentation-client.ts exists — without it, Sentry can't trace
// client-side route transitions. Required export, not optional config.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
