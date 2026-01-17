import { test, expect } from '@playwright/test';
import { attachTestLogging } from './helpers/test-logger';
import { seedLocalStorage, loginAs } from './helpers/seed';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
});

test.describe('Smoke Tests - Critical Path', () => {
  test('Uygulama store ekranını açar', async ({ page }) => {
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
  });

  test('Home ekranı açılır', async ({ page }) => {
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'home');
    await expect(page.locator('[data-testid="page-home"]')).toBeVisible();
  });

  test('End of Day ekranı açılır', async ({ page }) => {
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
    await page.goto('/#/endoftheday');
    await expect(page.locator('[data-testid="page-endoftheday"]')).toBeVisible();
  });
});