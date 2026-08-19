import fs from 'fs';
import path from 'path';
import { test, expect, Page } from '@playwright/test';

// Local dev's `next dev` (this suite's webServer) loads .env.local
// automatically, but the Playwright *test runner* process is separate and
// doesn't — load it here too, for the one test below that needs real
// secrets (STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY) to sign a real
// webhook event. No `dotenv` dependency: just enough parsing for KEY=VALUE
// lines, and it's a no-op (not a throw) if the file doesn't exist — CI is
// expected to inject real env vars directly rather than via a committed or
// generated .env.local.
(function loadDotEnvLocal() {
  const envPath = path.resolve(__dirname, '../../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2];
    }
  }
})();

// A fake-but-well-shaped Supabase session, injected straight into
// localStorage the way @supabase/supabase-js persists it. Good enough for
// tests that only exercise *frontend* rendering logic (this file mocks every
// network call these fake tokens would otherwise need to survive) — not a
// substitute for a real session in tests that hit real backend auth.
function fakeSession(userId: string, email: string) {
  return {
    access_token: 'fake-access-token-for-e2e',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'fake-refresh-token-for-e2e',
    user: {
      id: userId,
      email,
      app_metadata: {},
      user_metadata: { full_name: 'E2E Test User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };
}

async function signIn(page: Page, tier: 'free' | 'pro' | 'team', userId = 'e2e-fake-user-id') {
  // Config first, so we know which Supabase project ref the storage key
  // needs (createClient's default storageKey is derived from the URL).
  await page.goto('/');
  const config = await page.evaluate(async () => (await fetch('/api/config')).json());
  const ref = new URL(config.supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${ref}-auth-token`;
  const session = fakeSession(userId, 'e2e@example.com');

  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key: storageKey, session }
  );

  // getPublisher() -> GET .../rest/v1/publishers?...id=eq.<userId> — mocked
  // so tier is deterministic and no real DB row is needed.
  await page.route('**/rest/v1/publishers**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          username: 'e2e-test',
          display_name: 'E2E Test',
          bio: null,
          website_url: null,
          tier,
          quiz_count: 0,
          created_at: new Date().toISOString(),
          stripe_customer_id: tier === 'free' ? null : 'cus_fake_e2e',
          stripe_subscription_id: tier === 'free' ? null : 'sub_fake_e2e',
        },
      ]),
    })
  );
}

test.describe('Tier-aware pricing CTA', () => {
  test('free user sees "Upgrade to Pro"', async ({ page }) => {
    await signIn(page, 'free');
    await page.goto('/pricing', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /upgrade to pro/i })).toBeVisible();
    await expect(page.getByText("You're on Pro")).not.toBeVisible();
  });

  test('pro user sees "You\'re on Pro ✓" and "Manage subscription"', async ({ page }) => {
    await signIn(page, 'pro');
    await page.goto('/pricing', { waitUntil: 'networkidle' });
    await expect(page.getByText("You're on Pro")).toBeVisible();
    await expect(page.getByRole('button', { name: /manage subscription/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^upgrade to pro/i })).not.toBeVisible();
  });
});

test.describe('Stripe checkout flow', () => {
  test('clicking "Upgrade to Pro" redirects to the Checkout URL from the API', async ({ page }) => {
    await signIn(page, 'free');
    await page.route('**/api/stripe/checkout', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/e2e-fake-session' }),
      })
    );
    await page.goto('/pricing', { waitUntil: 'networkidle' });

    // The app does window.location.href = url — Playwright reports that as
    // a navigation to an (unreachable, fake) external URL, which is enough
    // to prove the redirect fired with the right target.
    const navigation = page.waitForURL('https://checkout.stripe.com/**', { timeout: 5000 }).catch(() => null);
    await page.getByRole('button', { name: /upgrade to pro/i }).click();
    await navigation;
    expect(page.url()).toContain('checkout.stripe.com/e2e-fake-session');
  });

  test('?upgraded=true shows the success banner on the dashboard, then clears the param', async ({ page }) => {
    await signIn(page, 'pro');
    // Dashboard also reads published_quizzes / published_quiz_attempts —
    // stub those empty so the page renders past its loading state.
    await page.route('**/rest/v1/published_quizzes**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/rest/v1/published_quiz_attempts**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/dashboard?upgraded=true', { waitUntil: 'networkidle' });
    await expect(page.getByText(/welcome to pro/i)).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Stripe billing portal', () => {
  test('valid customer redirects to the Stripe portal URL', async ({ page }) => {
    await signIn(page, 'pro');
    await page.route('**/api/stripe/portal', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://billing.stripe.com/e2e-fake-portal' }),
      })
    );
    await page.goto('/pricing', { waitUntil: 'networkidle' });

    const navigation = page.waitForURL('https://billing.stripe.com/**', { timeout: 5000 }).catch(() => null);
    await page.getByRole('button', { name: /manage subscription/i }).click();
    await navigation;
    expect(page.url()).toContain('billing.stripe.com/e2e-fake-portal');
  });

  test('no-customer edge case shows a clean error, not a raw 400 body', async ({ page }) => {
    await signIn(page, 'pro');
    await page.route('**/api/stripe/portal', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'no_stripe_customer' }),
      })
    );
    await page.goto('/pricing', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /manage subscription/i }).click();

    // Should stay on the page (no navigation to a Stripe URL)...
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('stripe.com');
    // ...and the raw error code must never appear as literal page text —
    // this is the exact leak the "already_pro" bug (fixed earlier) was.
    await expect(page.getByText('no_stripe_customer', { exact: false })).toHaveCount(0);
  });
});

// ── Webhook-driven tier update ──────────────────────────────────────────
// Genuinely integration-level, not mocked: builds a real Stripe-signed
// `checkout.session.completed` event (using the real STRIPE_WEBHOOK_SECRET,
// via Stripe's own test-signing helper) and POSTs it straight at the local
// dev server's /api/stripe/webhook, then reads the DB row back to confirm
// tier actually flipped. Runs against a disposable auth user + publisher
// row created and torn down within the test — never touches a real
// publisher's data. Skips (not fails) when the required secrets aren't in
// the environment, since CI/other machines won't have this project's real
// Supabase/Stripe credentials.
test.describe('Webhook: checkout.session.completed', () => {
  const hasSecrets =
    Boolean(process.env.STRIPE_WEBHOOK_SECRET) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    Boolean(process.env.SUPABASE_URL);

  test('upgrades the publisher to pro and stores the Stripe customer/subscription ids', async ({
    request,
  }) => {
    test.skip(!hasSecrets, 'requires STRIPE_WEBHOOK_SECRET + Supabase service role key locally');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');

    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const testEmail = `e2e-webhook-${Date.now()}@example.com`;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: testEmail,
      email_confirm: true,
    });
    expect(createErr).toBeNull();
    const userId = created.user.id;

    try {
      const { error: pubErr } = await admin.from('publishers').insert({
        id: userId,
        username: `e2e-webhook-${Date.now()}`,
        display_name: 'E2E Webhook Test',
        tier: 'free',
      });
      expect(pubErr).toBeNull();

      const payload = JSON.stringify({
        id: 'evt_e2e_test',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_e2e',
            object: 'checkout.session',
            customer: 'cus_e2e_test',
            subscription: 'sub_e2e_test',
            metadata: { publisher_id: userId },
          },
        },
      });

      const signature = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET,
      });

      const res = await request.post('/api/stripe/webhook', {
        data: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signature,
        },
      });
      expect(res.status()).toBe(200);

      const { data: updated } = await admin
        .from('publishers')
        .select('tier, stripe_customer_id, stripe_subscription_id')
        .eq('id', userId)
        .single();

      expect(updated.tier).toBe('pro');
      expect(updated.stripe_customer_id).toBe('cus_e2e_test');
      expect(updated.stripe_subscription_id).toBe('sub_e2e_test');
    } finally {
      // Teardown — publisher row cascades from auth.users FK, but delete
      // explicitly rather than depend on that ordering.
      await admin.from('publishers').delete().eq('id', userId);
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
