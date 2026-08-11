import { test, expect } from '@playwright/test';

test.describe('Legal pages', () => {

  test('terms of service loads',
  async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(
      page.getByRole('heading', { name: 'Terms of Service' })
    ).toBeVisible();
    await expect(
      page.getByText('AutoShiftOps').first()
    ).toBeVisible();
  });

  test('privacy policy loads with table',
  async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(
      page.getByRole('heading', { name: 'Privacy Policy' })
    ).toBeVisible();
    await expect(
      page.getByText('Supabase').first()
    ).toBeVisible();
  });

  test('security page loads',
  async ({ page }) => {
    await page.goto('/security');
    await expect(
      page.getByRole('heading', { name: 'Security', exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Infrastructure').first()
    ).toBeVisible();
  });

  test('footer links work',
  async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', {
      name: 'Terms'
    }).click();
    await expect(page).toHaveURL('/legal/terms');
  });

});
