import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {

  test('LT-03: loads with three tiers',
  async ({ page }) => {
    await page.goto('/pricing');
    // exact match — tier labels are visually uppercase via CSS
    // text-transform, but the DOM text itself is title-case and each
    // word also appears as a substring elsewhere on the page (e.g. "Free"
    // inside "Start for free →").
    await expect(
      page.getByText('Free', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Pro', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Enterprise', { exact: true })
    ).toBeVisible();
  });

  test('monthly/annual toggle works',
  async ({ page }) => {
    await page.goto('/pricing');
    await expect(
      page.getByText('$9')
    ).toBeVisible();
    // The billing toggle button, not the "Annual invoicing / PO accepted"
    // Enterprise feature-list line further down the page.
    await page.getByRole('button', { name: /annual/i }).click();
    await expect(
      page.getByText('$7')
    ).toBeVisible();
  });

  test('signed-out Pro CTA reads "Upgrade to Pro" (waitlist replaced by real Stripe checkout, M2-01)',
  async ({ page }) => {
    await page.goto('/pricing');
    await expect(
      page.getByRole('button', { name: /upgrade to pro/i })
    ).toBeVisible();
    // The old "Join Pro waitlist" CTA/modal-open flow this test used to
    // cover no longer exists on this page — see tests/e2e/stripe.spec.ts
    // for the tier-aware CTA and checkout-redirect coverage that replaced
    // it (LT-35 in LIVE_TEST_PLAN.md is stale for the same reason).
  });

  test('enterprise CTA has mailto link',
  async ({ page }) => {
    await page.goto('/pricing');
    const contactBtn = page.getByRole('link', {
      name: /contact us/i
    });
    await expect(contactBtn).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:')
    );
  });

});
