import { test, expect } from '@playwright/test';

// Overridable so anyone cloning the repo (or CI, via e2e.yml's env block)
// can point this at a publisher that actually exists in their own
// Supabase project, rather than this repo's real one.
const TEST_PUBLISHER =
  process.env.TEST_PUBLISHER_USERNAME || 'sudhakarsajja';

test.describe('Publisher profile', () => {

  test('LT-34: valid profile loads',
  async ({ page }) => {
    await page.goto(`/q/${TEST_PUBLISHER}`);
    // NavBar renders (page loaded) — scoped to <header> specifically,
    // since the Footer also renders its own <nav> of link text, and a
    // bare 'nav' locator matches both (strict-mode violation).
    await expect(
      page.locator('header nav')
    ).toBeVisible({ timeout: 10000 });
    // Should NOT show our custom 404 text
    const is404 = await page
      .getByText('Page not found')
      .isVisible()
      .catch(() => false);
    expect(is404).toBe(false);
    // Should show publisher-related content (either profile or empty
    // state). .first() on every locator here, not just .catch() — each of
    // these substrings genuinely matches 2-3 elements on the real page
    // ('Sudhakar' hits both the <h1> and the "@sudhakarsajja" byline,
    // 'quizzes' hits the stat line and the section label, 'Published' hits
    // both too), which is a strict-mode violation Playwright throws on for
    // .isVisible(), not just a "zero matches" case. Confirmed by running
    // this against the real page: without .first(), all three checks threw
    // and were silently swallowed by .catch(() => false), so hasContent
    // was always false regardless of what the page actually showed.
    const hasContent =
      await page.getByText('Sudhakar').first()
        .isVisible().catch(() => false) ||
      await page.getByText('quizzes').first()
        .isVisible().catch(() => false) ||
      await page.getByText('Published').first()
        .isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('unknown publisher returns 404',
  async ({ page }) => {
    const response = await page.goto(
      '/q/fake-user-xyz123'
    );
    // Check HTTP status is 404
    expect(response?.status()).toBe(404);
    // .first() — the custom 404 page shows both "404" and "Page not
    // found" at once, so the .or() union has two visible matches.
    await expect(
      page.getByText('Page not found')
        .or(page.getByText('404'))
        .or(page.getByText('not found',
          { exact: false }))
        .first()
    ).toBeVisible({ timeout: 5000 });
  });

});
