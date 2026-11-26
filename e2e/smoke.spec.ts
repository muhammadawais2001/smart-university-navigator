import { test, expect } from '@playwright/test';

// Requires a configured Supabase project with supabase/seed.sql applied.
// Admin steps need E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
test('search -> select -> details -> directions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: /search campus/i }).first().fill('library');
  await page.getByRole('option', { name: /library/i }).first().click();
  await expect(page.getByRole('heading', { name: /library/i })).toBeVisible();
  await page.getByRole('link', { name: /directions/i }).click();
  await expect(page.getByText(/route not verified|calculated route/i)).toBeVisible({ timeout: 15000 });
});

test('admin can log in and open location management', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL, 'admin credentials not provided');
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.goto('/admin/locations');
  await expect(page.getByRole('heading', { name: /locations/i })).toBeVisible();
});
