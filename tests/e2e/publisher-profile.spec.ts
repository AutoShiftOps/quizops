import { test, expect } from '@playwright/test';

test.describe('Publisher profile', () => {

  test('LT-34: valid profile loads',
  async ({ page }) => {
    await page.goto('/q/sudhakarsajja');
    // Should not be a 404 page
    // Check the URL didn't redirect to 404
    await expect(page).not.toHaveURL(/404/);
    // Page should have some content
    await expect(page.locator('body'))
      .not.toBeEmpty();
    // Should have our NavBar (proves page loaded) — scoped to <header>
    // specifically, since the Footer also renders its own <nav> of link
    // text, and a bare 'nav' locator matches both (strict-mode violation).
    await expect(page.locator('header nav'))
      .toBeVisible({ timeout: 10000 });
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
