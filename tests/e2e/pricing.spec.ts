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

  test('waitlist modal opens on Pro CTA',
  async ({ page }) => {
    await page.goto('/pricing');
    await page.getByRole('button', {
      name: /join pro waitlist/i
    }).click();
    await expect(
      page.getByText('Join the Pro waitlist')
    ).toBeVisible();
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
