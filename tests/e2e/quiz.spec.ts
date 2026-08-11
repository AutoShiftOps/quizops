import { test, expect } from '@playwright/test';

test.describe('Practice quiz', () => {

  test('LT-30: quiz page loads correctly',
  async ({ page }) => {
    await page.goto('/quiz/devops-cicd');
    // First question visible
    await expect(
      page.locator('.question-text, [data-testid="question"]')
        .or(page.getByText(
          'What is the primary goal'
        ))
    ).toBeVisible({ timeout: 10000 });
    // Timer visible
    await expect(
      page.getByText(/\d+:\d+/)
    ).toBeVisible();
    // Progress indicator
    await expect(
      page.getByText('Question 1 of')
    ).toBeVisible();
  });

  test('guest can take quiz without login',
  async ({ page }) => {
    await page.goto('/quiz/devops-cicd');
    // Should load without redirect to login
    await expect(page).toHaveURL(
      '/quiz/devops-cicd'
    );
    await expect(
      page.getByText('Question 1 of')
    ).toBeVisible({ timeout: 10000 });
  });

  test('LT-37: unknown slug returns 404',
  async ({ page }) => {
    await page.goto('/quiz/fake-nonexistent');
    // Custom 404 or Next.js 404
    const title = await page.title();
    const has404 =
      title.includes('404') ||
      await page.getByText('404')
        .isVisible().catch(() => false) ||
      await page.getByText('not found',
        { exact: false }).isVisible()
        .catch(() => false);
    expect(has404).toBe(true);
  });

});
