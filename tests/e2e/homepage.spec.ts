import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {

  test('LT-28: loads with dark theme',
  async ({ page }) => {
    await page.goto('/');
    // NavBar visible — scoped to the header, since the footer also
    // renders a <nav> of its own further down the page.
    const navbar = page.getByRole('banner').locator('nav');
    await expect(navbar)
      .toBeVisible();
    // Hero headline present
    await expect(page.locator('h1'))
      .toContainText('Turn articles into');
    // Dark background
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body)
        .backgroundColor
    );
    expect(bg).not.toBe('rgb(255, 255, 255)');
    // NavBar sticky — still visible after scroll
    await page.evaluate(() =>
      window.scrollTo(0, 800)
    );
    await expect(navbar)
      .toBeVisible();
  });

  test('LT-01: social proof bar visible',
  async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText('Quizzes published')
    ).toBeVisible();
    await expect(
      page.getByText('GPT-4o')
    ).toBeVisible();
  });

  test('LT-02: no horizontal scrollbar',
  async ({ page }) => {
    await page.goto('/');
    const hasHScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    );
    expect(hasHScroll).toBe(false);
  });

  test('hero CTA buttons are wired',
  async ({ page }) => {
    await page.goto('/');
    const startBtn = page.getByRole('link', {
      name: /start for free/i
    }).first();
    await expect(startBtn).toHaveAttribute(
      'href', '/dashboard'
    );
  });

  test('NavBar links navigate correctly',
  async ({ page }) => {
    await page.goto('/');
    // Scoped to the header — the footer has its own "Pricing" link too.
    await page.getByRole('banner').getByRole('link', {
      name: 'Pricing'
    }).click();
    await expect(page).toHaveURL('/pricing');
  });

});
