const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withSentryConfig(nextConfig, {
  org: 'autoshiftops',
  project: 'quizops',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // No SENTRY_AUTH_TOKEN configured — source map upload needs it and would
  // otherwise fail the build. Error tracking itself doesn't need it; this
  // only disables the upload step, per M1-07's own fallback instruction.
  sourcemaps: { disable: true },
});
