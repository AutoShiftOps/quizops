const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // M3-05 iFrame embed — /embed/[username]/[slug] needs to render inside a
  // publisher's own page. Content-Security-Policy's frame-ancestors is what
  // browsers actually honor for this (X-Frame-Options has no real "allow
  // all" value — ALLOWALL isn't a recognized value at all, so it's a no-op;
  // CSP is the directive doing the actual work here, and takes precedence
  // over X-Frame-Options in modern browsers regardless).
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ];
  },
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
