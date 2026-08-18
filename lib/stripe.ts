import Stripe from 'stripe';

// Server-only — STRIPE_SECRET_KEY must never reach client-bundled code. It
// lives in Vercel env vars only (see .env.example), never committed here.
//
// apiVersion: the spec called for '2024-06-20', but the stripe npm package
// actually installed here (latest, since none was pinned) types apiVersion
// as a literal union of only the versions it ships fixtures/types for — an
// older string doesn't type-check against it. Pinned to the version this
// package's types actually require; update this if the package is ever
// upgraded and the build starts failing here again.
//
// Lazily constructed (like lib/supabase.ts's getSupabaseClient()) rather
// than a top-level `export const stripe = new Stripe(...)`: Next.js
// evaluates every route module at build time to collect page data, and
// this app deliberately never has a real STRIPE_SECRET_KEY available in
// that environment (only Vercel's runtime holds it) — constructing eagerly
// at import time throws during `next build` itself.
let cached: Stripe | undefined;

export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-07-29.dahlia',
    });
  }
  return cached;
}
