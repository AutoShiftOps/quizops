import { test, expect } from '@playwright/test';

test.describe('Publisher profile', () => {

  test('LT-34: valid profile loads',
  async ({ page }) => {
    await page.goto('/q/sudhakarsajja');
    // Should NOT 404
    await expect(page).not.toHaveURL(
      /.*404.*/
    );
    // Should show publisher name or quizzes
    const loaded =
      await page.getByText('Sudhakar')
        .isVisible().catch(() => false) ||
      await page.getByText('Published Quizzes',
        { exact: false })
        .isVisible().catch(() => false);
    expect(loaded).toBe(true);
  });

  test('unknown publisher returns 404',
  async ({ page }) => {
    await page.goto('/q/fake-user-xyz123');
    // .first() — the custom 404 page shows both "404" and "Page not
    // found" at once, so the .or() union has two visible matches.
    await expect(
      page.getByText('404')
        .or(page.getByText('not found',
          { exact: false }))
        .first()
    ).toBeVisible({ timeout: 5000 });
  });

});
